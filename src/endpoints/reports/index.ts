import { ReportCreate } from "@/endpoints/reports/create";
import { ReportGet } from "@/endpoints/reports/get";
import { ReportList } from "@/endpoints/reports/list";

export const reportsEndpoints = {
  create: ReportCreate,
  get: ReportGet,
  list: ReportList,
};
