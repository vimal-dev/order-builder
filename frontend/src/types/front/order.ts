export interface IAttachment {
    id: number;
    name: string;
    file: string;
    url: string;
    ext: string;
    status: string;
    comment: string | null;
    created: string;
    updated: string;
}

export interface IOrderItemProperties {
    name: string;
    value: any;
}

export interface IOrderItem {
    id: string;
    order_id: string;
    product_name?: string;
    title?: string;
    sku: string;
    quantity?: string;
    properties: IOrderItemProperties[];
    status: string;
    custom_design?: string;
    created: string;
    updated: string;
}


export interface IOrder {
    id: string;
    order_number: string;
    customer_name?: string;
    customer_email: string;
    order_items: IOrderItem[];
    status: string;
    created: string;
    updated: string;
}


