import { locationLabelFromValue, labelFromValue } from '@/lib/utils';

export interface InventoryUnit {
  id: string;
  orderCol: number;
  stockNumber: string;
  vin?: string | null;
  fullBrochure?: string | null;
  msrp?: string | null;
  location: string;
  title: string;
  bodySlug: string;
  wI_Body: string;
  wI_Make: string;
  wI_Model: string;
  wI_Configuration: string;
  wI_Year: number;
  customTags: string[];
  features: string[];
  richText?: string | null;
  imageCloudinaryIds?: string[];
  images?: string[];
  thumbnails?: string[];
  defaultImageUrl?: string;
  wI_InventoryType: string;
  wI_Engine: string;
  wI_Fuel: string;
  sleepsCount: number;
  slideOutsCount: number;
  wI_Length: number;
  wI_Mileage: number;
  wI_DaysInStock: number;
  wI_ListPrice: number;
  wI_MapPrice: number;
  wI_SalePrice: number;
  websitePrice: number;
  priceFlag?: string | null;
  rebate?: {
    amount: number;
    enddate: number;
    timezone: string;
    type: string;
  };
  inFlashSale: boolean;
  isSpecialOffer: boolean;
  isTooLowToShow: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  order_col: number;
  stock_number: string;
  vin?: string | null;
  full_brochure?: string | null;
  msrp?: string | null;
  location: string;
  title: string;
  wi_body: string;
  wi_make: string;
  wi_model: string;
  wi_configuration: string;
  wi_year: number;
  custom_tags?: string[] | null;
  features?: string[] | null;
  rich_text?: string | null;
  image_cloudinary_ids?: string[] | null;
  images?: string[] | null;
  thumbnails?: string[] | null;
  default_image_url?: string | null;
  wi_inventory_type: string;
  wi_engine?: string | null;
  wi_fuel: string;
  sleeps_count: number;
  slide_outs_count: number;
  wi_length: number;
  wi_mileage: number;
  wi_days_in_stock: number;
  wi_list_price: number;
  wi_map_price: number;
  wi_sale_price: number;
  website_price: number;
  price_flag?: string | null;
  rebate_amount?: number | null;
  rebate_enddate?: number | null;
  rebate_timezone?: string | null;
  rebate_type?: string | null;
  in_flash_sale: boolean;
  is_special_offer: boolean;
  is_too_low_to_show: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryPagination {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface InventoryListResponse {
  code: number;
  message: string;
  data: {
    inventories: InventoryItem[];
    pagination: InventoryPagination;
  };
}

export interface InventoryResponse {
  code: number;
  message: string;
  data: {
    inventory: InventoryItem;
  };
}

export function mapInventoryItem(r: InventoryItem): InventoryUnit {
  const amount = r.rebate_amount;
  const rebate =
    typeof amount === 'number' && amount > 0
      ? {
          amount,
          enddate: r.rebate_enddate ?? 0,
          timezone: r.rebate_timezone ?? '',
          type: r.rebate_type ?? '',
        }
      : undefined;

  return {
    id: r.id,
    orderCol: r.order_col,
    stockNumber: r.stock_number,
    vin: r.vin ?? undefined,
    fullBrochure: r.full_brochure ?? undefined,
    msrp: r.msrp ?? undefined,
    location: locationLabelFromValue(r.location),
    title: r.title,
    bodySlug: r.wi_body,
    wI_Body: labelFromValue(r.wi_body),
    wI_Make: labelFromValue(r.wi_make),
    wI_Model: labelFromValue(r.wi_model),
    wI_Configuration: labelFromValue(r.wi_configuration),
    wI_Year: r.wi_year,
    customTags: r.custom_tags ?? [],
    features: r.features ?? [],
    richText: r.rich_text ?? undefined,
    imageCloudinaryIds: r.image_cloudinary_ids ?? [],
    images: r.images ?? [],
    thumbnails: r.thumbnails ?? [],
    defaultImageUrl: r.default_image_url ?? undefined,
    wI_InventoryType: labelFromValue(r.wi_inventory_type),
    wI_Engine: r.wi_engine ?? '',
    wI_Fuel: labelFromValue(r.wi_fuel),
    sleepsCount: r.sleeps_count,
    slideOutsCount: r.slide_outs_count,
    wI_Length: r.wi_length,
    wI_Mileage: r.wi_mileage,
    wI_DaysInStock: r.wi_days_in_stock,
    wI_ListPrice: r.wi_list_price,
    wI_MapPrice: r.wi_map_price,
    wI_SalePrice: r.wi_sale_price,
    websitePrice: r.website_price,
    priceFlag: r.price_flag,
    rebate,
    inFlashSale: r.in_flash_sale,
    isSpecialOffer: r.is_special_offer,
    isTooLowToShow: r.is_too_low_to_show,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface ChatGPTResponse {
  code: number;
  message: string;
  data: {
    mode?: 'list' | 'rag' | 'general';
    intent?: string;
    reply?: string;
    inventories?: InventoryItem[];
    pagination?: InventoryPagination;
    retrieval?: {
      candidate_count?: number;
      chunk_count?: number;
    };
  };
}
