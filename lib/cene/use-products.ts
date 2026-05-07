"use client"

import { useState, useEffect } from "react"
import { PLACEHOLDER_PROIZVODI, PlaceholderProizvod } from "./placeholder-proizvodi"

const STORAGE_KEY = "rio-erp-cene-proizvodi"

export function useProducts() {
  const [products, setProducts] = useState<PlaceholderProizvod[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setProducts(JSON.parse(stored))
      } catch {
        setProducts(PLACEHOLDER_PROIZVODI)
      }
    } else {
      setProducts(PLACEHOLDER_PROIZVODI)
    }
    setHydrated(true)
  }, [])

  const save = (list: PlaceholderProizvod[]) => {
    setProducts(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  const addProduct = (naziv: string, opis?: string) => {
    const slug = naziv
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
    const id = `${slug}-${Date.now()}`
    save([...products, { id, naziv, opis }])
  }

  const deleteProduct = (id: string) => {
    save(products.filter((p) => p.id !== id))
  }

  const findProduct = (id: string) => products.find((p) => p.id === id)

  return { products, hydrated, addProduct, deleteProduct, findProduct }
}
