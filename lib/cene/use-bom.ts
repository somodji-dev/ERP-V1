"use client"

import { useState, useEffect } from "react"

export interface BomItem {
  id: string
  naziv: string
  materijal_id?: string
  udeo: number       // decimalni (0.4 = 40%)
  cena_po_kg: number // din/kg
}

export function useBom(productId: string) {
  const key = `rio-erp-bom-${productId}`
  const kgKey = `rio-erp-bom-kg-${productId}`

  const [items, setItems] = useState<BomItem[]>([])
  const [ukupnaKolicina, setUkupnaKolicina] = useState<number>(1)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(key)
      if (storedItems) setItems(JSON.parse(storedItems))

      const storedKg = localStorage.getItem(kgKey)
      if (storedKg) setUkupnaKolicina(parseFloat(storedKg) || 1)
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [key, kgKey])

  const saveItems = (list: BomItem[]) => {
    setItems(list)
    localStorage.setItem(key, JSON.stringify(list))
  }

  const saveKolicina = (kg: number) => {
    setUkupnaKolicina(kg)
    localStorage.setItem(kgKey, String(kg))
  }

  const addItem = (item: Omit<BomItem, "id">) => {
    saveItems([...items, { ...item, id: crypto.randomUUID() }])
  }

  const updateItem = (id: string, patch: Partial<Omit<BomItem, "id">>) => {
    saveItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const removeItem = (id: string) => {
    saveItems(items.filter((i) => i.id !== id))
  }

  return { items, ukupnaKolicina, hydrated, addItem, updateItem, removeItem, saveKolicina }
}
