import { Button } from "@/components/atoms"
import { useTranslator } from "@/lib/i18n/client"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export function CartEmpty() {
  const { tr } = useTranslator()
  return (
    <div className="col-span-12 pt-4 py-6 flex justify-center" data-testid="cart-empty">
      <div className="w-[466px] flex flex-col">
        <h2 className="text-primary heading-lg text-center">{tr("Το καλάθι σου")}</h2>
        <p className="mt-2 text-lg text-secondary text-center">
          {tr("Το καλάθι σου είναι άδειο.")}
        </p>
        <LocalizedClientLink href="/#vitrina" className="mt-6">
          <Button className="w-full py-3 flex justify-center items-center">
            {tr("Δες τις βιτρίνες")}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
