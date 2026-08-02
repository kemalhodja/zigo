export function slugifyEducationArea(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function matchAreaBySlug<T extends { area_name: string }>(areas: T[], slug: string) {
  const normalized = slugifyEducationArea(slug);
  return areas.find((area) => slugifyEducationArea(area.area_name) === normalized) ?? null;
}
