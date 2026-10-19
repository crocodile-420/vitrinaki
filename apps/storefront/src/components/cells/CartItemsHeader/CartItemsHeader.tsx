import { SingleProductSeller } from "@/types/product"
import { SellerAvatar } from "../SellerAvatar/SellerAvatar"

// Shows which shop the items come from. Vitrinaki has no marketplace seller
// pages, so this is a label rather than a link.
export const CartItemsHeader = ({ seller }: { seller: SingleProductSeller }) => (
  <div className="border rounded-sm p-4 flex gap-4 items-center">
    {seller.photo ? <SellerAvatar photo={seller.photo} size={32} alt={seller.name} /> : null}
    <p className="uppercase heading-xs">{seller.name}</p>
  </div>
)
