import { injectable } from "tsyringe";
import { PhaKy } from "../models/phaky";
import { PhaKyRepository } from "../repositories/phaKyRepository";

@injectable()
export class PhaKyService {
  constructor(private phaKyRepository: PhaKyRepository) {}

  async getByDongHo(dongHoId: string): Promise<PhaKy | null> {
    return await this.phaKyRepository.getByDongHo(dongHoId);
  }

  async search(
    pageIndex: number,
    pageSize: number,
    searchContent: string,
    dongHoId: string
  ): Promise<PhaKy[]> {
    return await this.phaKyRepository.search(pageIndex, pageSize, searchContent, dongHoId);
  }

  async create(phaKy: PhaKy): Promise<any> {
    if (!phaKy.dongHoId) throw new Error("dongHoId là bắt buộc");
    return await this.phaKyRepository.create(phaKy);
  }

  async update(phaKy: PhaKy): Promise<any> {
    if (!phaKy.phaKyId) throw new Error("phaKyId là bắt buộc");
    if (!phaKy.dongHoId) throw new Error("dongHoId là bắt buộc");
    return await this.phaKyRepository.update(phaKy);
  }

  async delete(phaKyId: string, luUserId: string): Promise<any> {
    return await this.phaKyRepository.delete(phaKyId, luUserId);
  }
}
