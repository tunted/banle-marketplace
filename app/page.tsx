"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ShoppingCart, Star, Truck, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string | null;
  description?: string | null;
  created_at?: string;
}

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setProducts(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch products");
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to Our Store
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Discover amazing products at unbeatable prices
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/cart">
            <Button size="lg">View Cart</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Truck className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Free Shipping</CardTitle>
            <CardDescription>On orders over $100</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Star className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Quality Products</CardTitle>
            <CardDescription>Curated selection of premium items</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <ShoppingCart className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Easy Returns</CardTitle>
            <CardDescription>30-day return policy</CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Products Grid */}
      <section>
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading products...</span>
          </div>
        ) : error ? (
          <Card className="p-6">
            <CardContent className="text-center">
              <p className="text-destructive">Error: {error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card className="p-6">
            <CardContent className="text-center">
              <p className="text-muted-foreground">No products available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <CardHeader className="flex-1">
                  <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="flex justify-between items-center gap-2">
                  <span className="text-2xl font-bold">
                    ${product.price.toFixed(2)}
                  </span>
                  <Button
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image || undefined,
                      })
                    }
                    className="shrink-0"
                  >
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

