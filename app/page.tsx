import React from 'react';
import AppShell from '@/components/AppShell';
import { CITIES } from '@/lib/cities';

export const revalidate = 3600; // 1 hour static cache

export default function HomePage() {
  return <AppShell initialCities={CITIES} />;
}
