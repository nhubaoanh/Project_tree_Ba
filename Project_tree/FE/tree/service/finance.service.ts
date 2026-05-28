import {
  ITransaction,
  PaginatedResponse,
  ApiResult,
  IUserSearch,
} from "@/types/Notification";
import { IContributionUp } from "@/types/contribuitionUp";
import { IContributionDown } from "@/types/contribuitionDown";
import { searchContributionUp, createContributionUp, deleteContributionUp } from "./contribuitionUp.service";
import { searchContributionDown, createContributionDown, deleteContributionDown } from "./contribuitionDown.service";
import storage from "@/utils/storage";

const mapThuToTransaction = (item: IContributionUp): ITransaction => ({
  giaoDichId: `THU-${item.thuId}`,
  loaiGiaoDich: "THU",
  soTien: Number(item.soTien),
  moTa: item.noiDung || "",
  ngayGiaoDich: item.ngayDong ? new Date(item.ngayDong).toISOString() : new Date().toISOString(),
  nguoiThucHien: item.hoTenNguoiDong || "",
  hangMuc: item.phuongThucThanhToan || "",
});

const mapChiToTransaction = (item: IContributionDown): ITransaction => ({
  giaoDichId: `CHI-${item.chiId}`,
  loaiGiaoDich: "CHI",
  soTien: Number(item.soTien),
  moTa: item.noiDung || "",
  ngayGiaoDich: item.ngayChi ? new Date(item.ngayChi).toISOString() : new Date().toISOString(),
  nguoiThucHien: item.nguoiNhan || "",
  hangMuc: item.phuongThucThanhToan || "",
});

export const getTransactions = async (
  params: IUserSearch
): Promise<ApiResult<PaginatedResponse<ITransaction>>> => {
  const dongHoId = params.dongHoId || "";

  const [thuRes, chiRes] = await Promise.all([
    searchContributionUp({ pageIndex: 1, pageSize: 999, search_content: params.search_content, dongHoId }),
    searchContributionDown({ pageIndex: 1, pageSize: 999, search_content: params.search_content, dongHoId }),
  ]);

  const thuList: ITransaction[] = (thuRes?.data || []).map(mapThuToTransaction);
  const chiList: ITransaction[] = (chiRes?.data || []).map(mapChiToTransaction);

  const all = [...thuList, ...chiList].sort(
    (a, b) => new Date(b.ngayGiaoDich).getTime() - new Date(a.ngayGiaoDich).getTime()
  );

  const totalRecords = all.length;
  const startIndex = (params.pageIndex - 1) * params.pageSize;
  const paginatedData = all.slice(startIndex, startIndex + params.pageSize);

  return {
    code: 200,
    message: "Success",
    data: {
      data: paginatedData,
      totalRecords,
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      totalPages: Math.ceil(totalRecords / params.pageSize) || 1,
    },
  };
};

export const getFinanceStats = async (
  dongHoId: string
): Promise<ApiResult<{ thu: number; chi: number; ton: number }>> => {
  const [thuRes, chiRes] = await Promise.all([
    searchContributionUp({ pageIndex: 1, pageSize: 999, dongHoId }),
    searchContributionDown({ pageIndex: 1, pageSize: 999, dongHoId }),
  ]);

  const thu = (thuRes?.data || []).reduce(
    (acc: number, curr: IContributionUp) => acc + Number(curr.soTien),
    0
  );
  const chi = (chiRes?.data || []).reduce(
    (acc: number, curr: IContributionDown) => acc + Number(curr.soTien),
    0
  );

  return {
    code: 200,
    message: "Success",
    data: { thu, chi, ton: thu - chi },
  };
};

export const createTransaction = async (
  trans: Partial<ITransaction> & { dongHoId: string }
): Promise<ApiResult<ITransaction>> => {
  const user = storage.getUser();
  const nguoiNhapId = user?.nguoiDungId || "";

  if (trans.loaiGiaoDich === "THU") {
    const payload: IContributionUp = {
      thuId: 0,
      dongHoId: trans.dongHoId,
      hoTenNguoiDong: trans.nguoiThucHien || "",
      ngayDong: trans.ngayGiaoDich ? new Date(trans.ngayGiaoDich) : new Date(),
      soTien: trans.soTien || 0,
      phuongThucThanhToan: trans.hangMuc || "",
      noiDung: trans.moTa || "",
      ghiChu: "",
      nguoiNhapId,
      ngayTao: new Date(),
      active_flag: 1,
      lu_updated: new Date(),
      lu_user_id: nguoiNhapId,
    };
    const res = await createContributionUp(payload);
    const created: ITransaction = mapThuToTransaction({ ...payload, thuId: res?.data?.thuId || 0 });
    return { code: 200, message: "Success", data: created };
  } else {
    const payload: IContributionDown = {
      chiId: 0,
      dongHoId: trans.dongHoId,
      ngayChi: trans.ngayGiaoDich ? new Date(trans.ngayGiaoDich) : new Date(),
      soTien: trans.soTien || 0,
      phuongThucThanhToan: trans.hangMuc || "",
      noiDung: trans.moTa || "",
      nguoiNhan: trans.nguoiThucHien || "",
      ghiChu: "",
      nguoiNhapId,
      ngayTao: new Date(),
      active_flag: 1,
      lu_updated: new Date(),
      lu_user_id: nguoiNhapId,
    };
    const res = await createContributionDown(payload);
    const created: ITransaction = mapChiToTransaction({ ...payload, chiId: res?.data?.chiId || 0 });
    return { code: 200, message: "Success", data: created };
  }
};

export const deleteTransaction = async (
  id: string
): Promise<ApiResult<boolean>> => {
  const user = storage.getUser();
  const userId = user?.nguoiDungId || "";

  if (id.startsWith("THU-")) {
    const thuId = Number(id.replace("THU-", ""));
    await deleteContributionUp([{ thuId }], userId);
  } else if (id.startsWith("CHI-")) {
    const chiId = Number(id.replace("CHI-", ""));
    await deleteContributionDown([{ chiId }], userId);
  }

  return { code: 200, message: "Success", data: true };
};
