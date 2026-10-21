'use client';

import { useTranslator } from "@/lib/i18n/client"
import { FC, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { HttpTypes } from '@medusajs/types';
import { FieldError, FieldValues, FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import CountrySelect from '@/components/cells/CountrySelect/CountrySelect';
import { addCustomerAddress, updateCustomerAddress } from '@/lib/data/customer';

import { AddressFormData, addressSchema } from './schema';

interface Props {
  defaultValues?: AddressFormData;

  regions: HttpTypes.StoreRegion[];
  handleClose?: () => void;
}

export const emptyDefaultAddressValues = {
  addressName: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  countryCode: '',
  postalCode: '',
  company: '',
  province: '',
  phone: '',
  metadata: {}
};

export const AddressForm: FC<Props> = ({ defaultValues, ...props }) => {
  const methods = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues || emptyDefaultAddressValues
  });

  return (
    <FormProvider {...methods}>
      <Form {...props} />
    </FormProvider>
  );
};

const Form: FC<Props> = ({ regions, handleClose }) => {
  const { tr } = useTranslator();
  const [error, setError] = useState<string>();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch
  } = useFormContext();

  const region = {
    countries: regions.flatMap(region => region.countries)
  };

  const submit = async (data: FieldValues) => {
    const formData = new FormData();
    formData.append('addressId', data.addressId || '');
    formData.append('address_name', data.addressName);
    formData.append('first_name', data.firstName);
    formData.append('last_name', data.lastName);
    formData.append('address_1', data.address);
    formData.append('address_2', '');
    formData.append('province', data.province);
    formData.append('city', data.city);
    formData.append('country_code', data.countryCode);
    formData.append('postal_code', data.postalCode);
    formData.append('company', data.company);
    formData.append('phone', data.phone);

    const res = data.addressId
      ? await updateCustomerAddress(formData)
      : await addCustomerAddress(formData);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setError('');
    handleClose && handleClose();
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      data-testid="address-form"
    >
      <div className="space-y-4 px-4">
        <div className="items-top mb-4 grid max-w-full grid-cols-2 gap-4">
          <LabeledInput
            label={tr("Όνομα διεύθυνσης")}
            placeholder={tr("Γράψε ένα όνομα για τη διεύθυνση")}
            className="col-span-2"
            error={errors.firstName as FieldError}
            data-testid="address-form-address-name-input"
            {...register('addressName')}
          />
          <LabeledInput
            label={tr("Όνομα")}
            placeholder={tr("Γράψε το όνομά σου")}
            error={errors.firstName as FieldError}
            data-testid="address-form-first-name-input"
            {...register('firstName')}
          />
          <LabeledInput
            label={tr("Επώνυμο")}
            placeholder={tr("Γράψε το επώνυμό σου")}
            error={errors.firstName as FieldError}
            data-testid="address-form-last-name-input"
            {...register('lastName')}
          />
          <LabeledInput
            label={tr("Εταιρεία (προαιρετικό)")}
            placeholder={tr("Γράψε την εταιρεία")}
            error={errors.company as FieldError}
            data-testid="address-form-company-input"
            {...register('company')}
          />
          <LabeledInput
            label={tr("Διεύθυνση")}
            placeholder={tr("Γράψε τη διεύθυνση")}
            error={errors.address as FieldError}
            data-testid="address-form-address-input"
            {...register('address')}
          />
          <LabeledInput
            label={tr("Πόλη")}
            placeholder={tr("Γράψε την πόλη")}
            error={errors.city as FieldError}
            data-testid="address-form-city-input"
            {...register('city')}
          />
          <LabeledInput
            label={tr("Ταχυδρομικός κώδικας")}
            placeholder={tr("Γράψε τον ταχυδρομικό κώδικα")}
            error={errors.postalCode as FieldError}
            data-testid="address-form-postal-code-input"
            {...register('postalCode')}
          />
          <LabeledInput
            label={tr("Νομός / Περιοχή")}
            placeholder={tr("Γράψε τον νομό / την περιοχή")}
            error={errors.province as FieldError}
            data-testid="address-form-province-input"
            {...register('province')}
          />
          <div>
            <CountrySelect
              region={region as HttpTypes.StoreRegion}
              {...register('countryCode')}
              value={watch('countryCode')}
              className="h-12"
              data-testid="address-form-country-select"
            />
            {errors.countryCode && (
              <p
                className="label-sm text-negative"
                data-testid="address-form-country-error"
              >
                {tr((errors.countryCode as FieldError).message ?? '')}
              </p>
            )}
          </div>

          <LabeledInput
            label={tr("Τηλέφωνο")}
            placeholder={tr("Γράψε το τηλέφωνό σου")}
            error={errors.phone as FieldError}
            data-testid="address-form-phone-input"
            {...register('phone')}
          />
        </div>
        {error && (
          <p
            className="label-md text-negative"
            data-testid="address-form-error"
          >
            {error}
          </p>
        )}
        <Button
          className="w-full"
          data-testid="address-form-submit-button"
        >
          {tr("Αποθήκευση διεύθυνσης")}
        </Button>
      </div>
    </form>
  );
};
