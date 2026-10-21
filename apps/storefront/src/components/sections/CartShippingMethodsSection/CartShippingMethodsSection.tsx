'use client';

import { useTranslator } from "@/lib/i18n/client"
import { Fragment, useEffect, useState, useTransition, type FC } from 'react';

import { Listbox, Transition } from '@headlessui/react';
import { CheckCircleSolid, ChevronUpDown, Loader } from '@medusajs/icons';
import type { HttpTypes } from '@medusajs/types';
import { clx, Heading, Text } from '@medusajs/ui';
import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/atoms';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
import { removeShippingMethod, setShippingMethod } from '@/lib/data/cart';
import { calculatePriceForShippingOption } from '@/lib/data/fulfillment';
import { courierName, freeShippingOver } from '@/lib/helpers/couriers';
import { convertToLocale } from '@/lib/helpers/money';

import { CartShippingMethodRow } from './CartShippingMethodRow';
import { CourierBadge } from './CourierBadge';

type ExtendedStoreProduct = HttpTypes.StoreProduct & {
  seller?: {
    id: string;
    name: string;
  };
};

type CartItem = {
  product?: ExtendedStoreProduct;
};

export type StoreCardShippingMethod = HttpTypes.StoreCartShippingOption & {
  seller_id?: string;
  seller_name?: string;
  service_zone?: {
    fulfillment_set: {
      type: string;
    };
  };
};

type ShippingProps = {
  cart: Omit<HttpTypes.StoreCart, 'items'> & {
    items?: CartItem[];
  };
  availableShippingMethods:
    | (StoreCardShippingMethod &
        {
          rules: any;
          seller_id: string;
          price_type: string;
          id: string;
          amount?: number;
        }[])
    | null;
};

const CartShippingMethodsSection: FC<ShippingProps> = ({ cart, availableShippingMethods }) => {
  const { tr } = useTranslator();
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPendingDeleteRow, startTransitionDeleteRow] = useTransition();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isOpen = searchParams.get('step') === 'delivery';

  const _shippingMethods = availableShippingMethods?.filter(
    sm => sm.rules?.find((rule: any) => rule.attribute === 'is_return')?.value !== 'true'
  );

  useEffect(() => {
    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter(sm => sm.price_type === 'calculated')
        .map(sm => calculatePriceForShippingOption(sm.id, cart.id));

      if (promises.length) {
        Promise.allSettled(promises).then(res => {
          const pricesMap: Record<string, number> = {};
          res
            .filter(r => r.status === 'fulfilled')
            .forEach(p => (pricesMap[p.value?.id || ''] = p.value?.amount!));

          setCalculatedPricesMap(pricesMap);
          setIsLoadingPrices(false);
        });
      }
    }
  }, [availableShippingMethods, _shippingMethods, cart.id]);

  const handleSubmit = () => {
    router.push(pathname + '?step=payment', { scroll: false });
  };

  const handleSetShippingMethod = async (id: string | null) => {
    if (!id) {
      return;
    }

    try {
      setError(null);
      setIsLoadingPrices(true);
      const res = await setShippingMethod({
        cartId: cart.id,
        shippingMethodId: id
      });
      if (!res.ok) {
        return setError(res.error?.message);
      }
    } catch (error: any) {
      setError(
        error?.message?.replace('Error setting up the request: ', '') || tr('Κάτι πήγε στραβά')
      );
    } finally {
      setIsLoadingPrices(false);
      router.refresh();
    }
  };

  const handleRemoveShippingMethod = (methodId: string) => {
    startTransitionDeleteRow(async () => {
      await removeShippingMethod(methodId);
    });
    router.refresh();
  };

  useEffect(() => {
    setError(null);
  }, [isOpen]);

  const groupedBySellerId = _shippingMethods?.reduce((acc: any, method) => {
    const sellerId = method.seller_id!;

    if (!acc[sellerId]) {
      acc[sellerId] = [];
    }

    const amount = Number(
      method.price_type === 'flat' ? method.amount : calculatedPricesMap[method.id]
    );

    if (!isNaN(amount)) {
      acc[sellerId]?.push(method);
    }

    return acc;
  }, {});

  const handleEdit = () => {
    router.replace(pathname + '?step=delivery');
  };
  const isEditEnabled = !isOpen && !!cart?.shipping_methods?.length;

  const filteredGroupedBySellerId = Object.keys(groupedBySellerId || {}).filter(
    key => groupedBySellerId?.[key]?.[0]?.seller_name
  );

  // The shipping method a seller currently has selected in the cart, matched by
  // the option ids that belong to that seller.
  const getSelectedMethodForSeller = (key: string) => {
    const optionIds = new Set<string>(
      (groupedBySellerId?.[key] ?? []).map((o: any) => o.id)
    );
    return cart.shipping_methods?.find(
      method =>
        !!method.shipping_option_id && optionIds.has(method.shipping_option_id)
    );
  };

  // Payment is only reachable once every seller in the cart has a method.
  const allSellersHaveMethod =
    filteredGroupedBySellerId.length > 0 &&
    filteredGroupedBySellerId.every(key => !!getSelectedMethodForSeller(key));

  // Map each selected method back to its seller name for the summary rows.
  const sellerNameByOptionId = new Map<string, string | undefined>(
    (_shippingMethods ?? []).map((option: any) => [option.id, option.seller_name])
  );

  // Courier (ACS, ΕΛΤΑ Courier, …) of each option, from the option's metadata.
  const courierByOptionId = new Map<string, string | null>(
    (_shippingMethods ?? []).map((option: any) => [option.id, courierName(option)])
  );

  const formatPrice = (amount: number) =>
    amount === 0
      ? tr('Δωρεάν')
      : convertToLocale({ amount, currency_code: cart?.currency_code });

  return (
    <div className="bg-ui-bg-interactive rounded-sm border p-4">
      <div className="mb-6 flex flex-row items-center justify-between">
        <Heading
          level="h2"
          className="text-3xl-regular flex flex-row items-baseline gap-x-2"
        >
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && <CheckCircleSolid />}
          {tr("Αποστολή")}
        </Heading>
        {isEditEnabled && (
          <Text>
            <Button
              onClick={handleEdit}
              variant="tonal"
            >
              {tr("Επεξεργασία")}
            </Button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div data-testid="delivery-options-container">
              <div className="pb-8 pt-2 md:pt-0">
                {filteredGroupedBySellerId.length === 0
                  ? tr('Δεν υπάρχουν διαθέσιμοι τρόποι αποστολής')
                  : filteredGroupedBySellerId.map(key => {
                      const selectedMethod = getSelectedMethodForSeller(key);

                      return (
                      <div
                        key={key}
                        className="mb-4"
                      >
                        <Heading
                          level="h3"
                          className="mb-2"
                        >
                          {groupedBySellerId[key][0].seller_name}
                        </Heading>
                        <Listbox
                          value={selectedMethod?.shipping_option_id ?? null}
                          onChange={value => {
                            handleSetShippingMethod(value);
                          }}
                        >
                          <div className="relative">
                            <Listbox.Button
                              className={clsx(
                                'text-base-regular relative flex h-12 w-full cursor-default items-center justify-between rounded-lg border bg-component-secondary px-4 text-left focus:outline-none focus-visible:border-gray-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300'
                              )}
                            >
                              {({ open }) => (
                                <>
                                  <span className="flex min-w-0 items-center truncate">
                                    {selectedMethod?.shipping_option_id ? (
                                      <CourierBadge
                                        name={courierByOptionId.get(selectedMethod.shipping_option_id)}
                                      />
                                    ) : null}
                                    <span className="truncate">
                                      {selectedMethod?.name ?? tr('Επίλεξε τρόπο αποστολής')}
                                    </span>
                                  </span>
                                  <ChevronUpDown
                                    className={clx('transition-rotate duration-200', {
                                      'rotate-180 transform': open
                                    })}
                                  />
                                </>
                              )}
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options
                                className="text-small-regular border-top-0 absolute z-20 max-h-60 w-full overflow-auto rounded-lg border bg-white focus:outline-none sm:text-sm"
                                data-testid="shipping-address-options"
                              >
                                {groupedBySellerId[key].map((option: any) => (
                                  <Listbox.Option
                                    className="relative cursor-pointer select-none border-b py-4 pl-6 pr-10 hover:bg-gray-50"
                                    value={option.id}
                                    key={option.id}
                                    data-testid="shipping-option"
                                  >
                                    <span className="flex items-center justify-between gap-3">
                                      <span className="flex min-w-0 items-center">
                                        <CourierBadge name={courierByOptionId.get(option.id)} />
                                        <span className="truncate">{option.name}</span>
                                      </span>
                                      <span className="shrink-0 font-semibold">
                                        {option.price_type === 'flat' ? (
                                          formatPrice(Number(option.amount))
                                        ) : calculatedPricesMap[option.id] !== undefined ? (
                                          formatPrice(calculatedPricesMap[option.id])
                                        ) : isLoadingPrices ? (
                                          <Loader />
                                        ) : (
                                          '-'
                                        )}
                                      </span>
                                    </span>
                                    {freeShippingOver(option) !== null && Number(option.amount) > 0 ? (
                                      <span className="mt-1 block text-xs text-ui-fg-subtle">
                                        {tr('Δωρεάν αποστολή για παραγγελίες από')}{' '}
                                        {convertToLocale({
                                          amount: freeShippingOver(option)!,
                                          currency_code: cart?.currency_code
                                        })}
                                      </span>
                                    ) : null}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>
                      );
                    })}
                {!!cart?.shipping_methods?.length && (
                  <div className="flex flex-col">
                    {cart.shipping_methods?.map(method => (
                      <CartShippingMethodRow
                        key={method.id}
                        method={method}
                        sellerName={
                          method.shipping_option_id
                            ? sellerNameByOptionId.get(method.shipping_option_id)
                            : undefined
                        }
                        courier={
                          method.shipping_option_id
                            ? courierByOptionId.get(method.shipping_option_id)
                            : undefined
                        }
                        currency_code={cart.currency_code}
                        onRemoveShippingMethod={handleRemoveShippingMethod}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              onClick={handleSubmit}
              variant="tonal"
              disabled={!allSellersHaveMethod || isPendingDeleteRow}
              loading={isLoadingPrices}
            >
              {tr("Συνέχεια στην πληρωμή")}
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col">
                {cart.shipping_methods?.map(method => (
                  <div
                    key={method.id}
                    className="mb-4 rounded-md border p-4"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">{tr("Τρόπος αποστολής")}</Text>
                    <Text className="txt-medium text-ui-fg-subtle flex flex-wrap items-center">
                      {method.shipping_option_id ? (
                        <CourierBadge name={courierByOptionId.get(method.shipping_option_id)} />
                      ) : null}
                      {method.name}{' '}
                      {formatPrice(Number(method.amount))}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartShippingMethodsSection;
