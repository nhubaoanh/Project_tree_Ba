import { API_CORE } from "@/constant/config";
import { apiClient } from "@/lib/api";
import storage from "@/utils/storage";

const prefix = `${API_CORE}/bank-transfer`;

export const getBankTransactionsByDongHo = async (
  dongHoId: string,
  pageIndex: number = 1,
  pageSize: number = 100
): Promise<any> => {
  try {
    const token = storage.getToken();
    const res = await apiClient.get(`${prefix}/bank-transactions/${dongHoId}`, {
      params: { pageIndex, pageSize },
      headers: { Authorization: token ? `Bearer ${token}` : "" }
    });
    return res?.data;
  } catch (error: any) { throw error; }
};

export const getBankTransactionsByUser = async (
  nguoiDungId: string,
  pageIndex: number = 1,
  pageSize: number = 100
): Promise<any> => {
  try {
    const token = storage.getToken();
    const res = await apiClient.get(`${prefix}/bank-transactions/user/${nguoiDungId}`, {
      params: { pageIndex, pageSize },
      headers: { Authorization: token ? `Bearer ${token}` : "" }
    });
    return res?.data;
  } catch (error: any) { throw error; }
};

export const getContributionsByDongHo = async (
  dongHoId: string,
  pageIndex: number = 1,
  pageSize: number = 10,
  trangThai: string = "verified"
): Promise<any> => {
  try {
    const token = storage.getToken();
    const params: Record<string, any> = { pageIndex, pageSize, trangThai };
    const res = await apiClient.get(`${prefix}/bank-transactions/${dongHoId}`, {
      params,
      headers: { Authorization: token ? `Bearer ${token}` : "" }
    });
    const responseBody = res?.data;
    const transactionData = responseBody?.data;
    const normalizedData = Array.isArray(transactionData) ? transactionData : transactionData ? [transactionData] : [];
    const pagination = responseBody?.pagination ? { pageIndex: Number(responseBody.pagination.pageIndex) || pageIndex, pageSize: Number(responseBody.pagination.pageSize) || pageSize, total: Number(responseBody.pagination.total) || normalizedData.length, totalPages: Math.ceil((Number(responseBody.pagination.total) || normalizedData.length) / pageSize) } : { pageIndex, pageSize, total: normalizedData.length, totalPages: Math.ceil(normalizedData.length / pageSize) };
    return { data: normalizedData, pagination };
  } catch (error: any) { throw error; }
};
