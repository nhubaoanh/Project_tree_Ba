import { API_CORE } from "@/constant/config";
import { apiClient } from "@/lib/api";
import { parseApiError } from "@/lib/apiError";

const prefix = `${API_CORE}/phaky`;

export interface ILuocSuItem {
  thoiGian: string;
  suKien: string;
  hinhAnh?: string;
}

export interface IButTichItem {
  hoTen: string;
  noiDung: string;
  hinhAnh?: string;
}

export interface ITruyenThongItem {
  hinhAnh?: string;
  noiDung: string;
}

export interface IPhaKy {
  phaKyId?: string;
  dongHoId: string;
  luocSu?: ILuocSuItem[];
  butTich?: IButTichItem[];
  viToAnh?: string;
  viToBiography?: string;
  viToHoTen?: string;
  tuDuongDiaChi?: string;
  tuDuongLinkMap?: string;
  tuDuongAnh?: string;
  tuDuongIframe?: string;
  toQuanDiaChi?: string;
  toQuanLinkMap?: string;
  toQuanAnh?: string;
  toQuanIframe?: string;
  truyenThong?: ITruyenThongItem[];
  nguoiTaoId?: string;
  tenDongHo?: string;
  lu_updated?: string;
}

export interface ISearchPhaKy {
  pageIndex: number;
  pageSize: number;
  search_content?: string;
  dongHoId: string;
}

export const getPhaKyByDongHo = async (dongHoId: string): Promise<any> => {
  try {
    const res = await apiClient.get(`${prefix}/dongho/${dongHoId}`);
    return res?.data;
  } catch (error: any) {
    const err = parseApiError(error);
    console.error(`[getPhaKyByDongHo] ${err.message}`);
    return { success: false, data: null, message: err.message };
  }
};

export const searchPhaKy = async (data: ISearchPhaKy): Promise<any> => {
  try {
    const res = await apiClient.post(`${prefix}/search`, data);
    return res?.data;
  } catch (error: any) {
    const err = parseApiError(error);
    console.error(`[searchPhaKy] ${err.message}`);
    return { success: false, data: [], message: err.message, totalItems: 0, pageCount: 0 };
  }
};

export const createPhaKy = async (data: IPhaKy): Promise<any> => {
  try {
    const res = await apiClient.post(`${prefix}`, data);
    return res?.data;
  } catch (error: any) {
    const err = parseApiError(error);
    console.error(`[createPhaKy] ${err.message}`);
    throw new Error(err.message);
  }
};

export const updatePhaKy = async (id: string, data: IPhaKy): Promise<any> => {
  try {
    const res = await apiClient.put(`${prefix}/${id}`, data);
    return res?.data;
  } catch (error: any) {
    const err = parseApiError(error);
    console.error(`[updatePhaKy] ${err.message}`);
    throw new Error(err.message);
  }
};

export const deletePhaKy = async (id: string, luUserId: string): Promise<any> => {
  try {
    const res = await apiClient.delete(`${prefix}/${id}`, { data: { lu_user_id: luUserId } });
    return res?.data;
  } catch (error: any) {
    const err = parseApiError(error);
    console.error(`[deletePhaKy] ${err.message}`);
    throw new Error(err.message);
  }
};
