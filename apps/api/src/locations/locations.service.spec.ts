import { LocationsService } from './locations.service';

describe('LocationsService', () => {
  const service = new LocationsService();

  it('returns the current 34 province and city list', () => {
    const provinces = service.getProvinces();

    expect(provinces).toHaveLength(34);
    expect(provinces).toContainEqual({ code: '79', name: 'Hồ Chí Minh' });
    expect(provinces).not.toContainEqual(
      expect.objectContaining({ name: 'Bình Dương' }),
    );
  });

  it('returns current wards for a province and no wards for an unknown code', () => {
    const wards = service.getWardsByProvince('79');

    expect(wards.length).toBeGreaterThan(0);
    expect(wards).toContainEqual(
      expect.objectContaining({ name: 'Phường Bến Thành' }),
    );
    expect(service.getWardsByProvince('999')).toEqual([]);
  });
});
