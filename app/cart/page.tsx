"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCartStore();
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({});

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleQuantityChange = (id: number, value: string) => {
    setQuantityInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleQuantityBlur = (id: number, currentQuantity: number) => {
    const inputValue = quantityInputs[id];
    if (inputValue !== undefined) {
      const newQuantity = parseInt(inputValue, 10);
      if (!isNaN(newQuantity) && newQuantity > 0) {
        updateQuantity(id, newQuantity);
      } else {
        // Reset to current quantity if invalid
        setQuantityInputs((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
    }
  };

  const handleQuantityKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: number,
    currentQuantity: number
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
      handleQuantityBlur(id, currentQuantity);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">Your cart is empty</CardTitle>
            <CardDescription>
              Add some items to your cart to get started
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const displayQuantity =
                quantityInputs[item.id] !== undefined
                  ? quantityInputs[item.id]
                  : item.quantity.toString();

              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      {item.image && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full sm:w-32 h-32 object-cover rounded-md"
                          />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {item.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>

                        {/* Quantity and Actions */}
                        <div className="flex items-center gap-4">
                          {/* Quantity Input */}
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`quantity-${item.id}`}
                              className="text-sm text-muted-foreground whitespace-nowrap"
                            >
                              Quantity:
                            </label>
                            <Input
                              id={`quantity-${item.id}`}
                              type="number"
                              min="1"
                              value={displayQuantity}
                              onChange={(e) =>
                                handleQuantityChange(item.id, e.target.value)
                              }
                              onBlur={() =>
                                handleQuantityBlur(item.id, item.quantity)
                              }
                              onKeyDown={(e) =>
                                handleQuantityKeyDown(
                                  e,
                                  item.id,
                                  item.quantity
                                )
                              }
                              className="w-20 text-center"
                            />
                          </div>

                          {/* Item Total */}
                          <div className="text-right min-w-[80px]">
                            <p className="text-sm text-muted-foreground">
                              Subtotal
                            </p>
                            <p className="font-semibold text-lg">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Clear Cart Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">
                    {items.length} item{items.length !== 1 ? "s" : ""} in cart
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

