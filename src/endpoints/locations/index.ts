import { LocationGet } from "@/endpoints/locations/get";
import { LocationList } from "@/endpoints/locations/list";

export const locationsEndpoints = {
  list: LocationList,
  get: LocationGet,
};
