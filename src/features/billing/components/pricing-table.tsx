import { formatPrice } from "@/features/billing/format"
import { CheckoutButton } from "@/features/billing/components/checkout-button"
import type { getProductsWithPrices } from "@/features/billing/queries"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type PricingTableProps = {
  products: Awaited<ReturnType<typeof getProductsWithPrices>>
  currentPriceId?: string | null
}

export const PricingTable = ({
  products,
  currentPriceId,
}: PricingTableProps) => {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No plans yet. Create a product with a price in the Stripe Dashboard; the
        webhook will sync it here.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            {product.description ? (
              <CardDescription>{product.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {product.prices.map((price) => (
              <div
                key={price.id}
                className="flex items-center justify-between gap-4"
              >
                <span className="font-medium tabular-nums">
                  {formatPrice(price)}
                </span>
                <CheckoutButton
                  priceId={price.id}
                  isCurrent={price.id === currentPriceId}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter />
        </Card>
      ))}
    </div>
  )
}
