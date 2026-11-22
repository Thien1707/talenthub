import { Injectable } from '@nestjs/common';
import administrativeDivisions from './vietnam-admin-divisions.json';

type AdministrativeDivision = {
  code: number;
  name: string;
  wards: Array<{ code: number; name: string }>;
};

// Snapshot from https://provinces.open-api.vn/api/v2/?depth=2; refresh as boundaries change.
const divisions = administrativeDivisions as AdministrativeDivision[];

function displayProvinceName(name: string) {
  return name.replace(/^(Tỉnh|Thành phố)\s+/, '');
}

@Injectable()
export class LocationsService {
  getProvinces() {
    return divisions.map(({ code, name }) => ({
      code: String(code),
      name: displayProvinceName(name),
    }));
  }

  getWardsByProvince(provinceCode: string) {
    const province = divisions.find(
      (item) => String(item.code) === provinceCode,
    );
    return province?.wards.map(({ code, name }) => ({
      code: String(code),
      name,
    })) ?? [];
  }
}
