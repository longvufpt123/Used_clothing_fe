import ghnAdministrative from '@/ghnAdministrative.json';

const normalizeAdministrativeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/\b(?:thanh pho|tp|tinh|quan|huyen|thi xa|thi tran|phuong|xa)\b/g, ' ')
    .replace(/\b\d{5,6}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const findAdministrativeMatch = <T extends { name: string }>(
  address: string,
  options: T[],
) => {
  const segments = address.split(',').map(normalizeAdministrativeName).filter(Boolean);
  const best = options
    .map((option) => {
      const name = normalizeAdministrativeName(option.name);
      const exact = segments.some((segment) => segment === name);
      const contained = name.length >= 3 && segments.some((segment) => segment.includes(name));
      return { option, score: exact ? 2000 + name.length : contained ? 1000 + name.length : 0 };
    })
    .sort((left, right) => right.score - left.score)[0];
  return best?.score ? best.option : undefined;
};

export const resolveGhnDestination = (address: string) => {
  let province = findAdministrativeMatch(address, ghnAdministrative.provinces);
  const directlyMatchedProvinceId = province?.id;
  let district = province
    ? findAdministrativeMatch(
        address,
        ghnAdministrative.districts.filter((item) => item.provinceId === directlyMatchedProvinceId),
      )
    : findAdministrativeMatch(address, ghnAdministrative.districts);

  // Một số địa chỉ bản đồ chỉ trả về thành phố trực thuộc (ví dụ Thủ Đức)
  // mà không kèm tên tỉnh/thành. Suy ngược tỉnh từ quận/huyện để vẫn tự điền GHN.
  if (!province && district) {
    province = ghnAdministrative.provinces.find((item) => item.id === district?.provinceId);
  }
  if (province && district && district.provinceId !== province.id) {
    district = findAdministrativeMatch(
      address,
      ghnAdministrative.districts.filter((item) => item.provinceId === province?.id),
    );
  }
  if (!province) return {};
  if (!district) return { province };
  const wards = ghnAdministrative.wards.filter((item) => item.districtId === district.id);
  return { province, district, ward: findAdministrativeMatch(address, wards) };
};
