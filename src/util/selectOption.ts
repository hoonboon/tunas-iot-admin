import { ProductModel } from "../models/Product";

export interface SelectOption {
    label: string;
    value: string;
    isDefault?: boolean;
    isSelected?: boolean;
}

// Gender
export function OPTIONS_GENDER() {
    return [
        { label: "Male 男", value: "M" },
        { label: "Female 女", value: "F" },
        { label: "Other 其他", value: "O" }
    ] as SelectOption[];
}

// Starter Kit Product
export function OPTIONS_STARTER_KIT_PRODUCT(list: ProductModel[]) {
    const result = [] as SelectOption[];
    if (list && list.length > 0) {
        list.forEach(product => {
            const option = {
                label: product.productName + " " + product.productNameCh,
                value: product._id.toString() // always convert to string for value comparison of type ObjectId
            };
            result.push(option);
        });
    }
    return result;
}

// Starter Kit Amount
export function OPTIONS_STARTER_KIT_AMOUNT() {
    return [
        { label: "MYR 0", value: "MYR0" },
        { label: "MYR 415", value: "MYR415" },
        { label: "MYR 440", value: "MYR440" },
        { label: "MYR 473", value: "MYR473" },
        { label: "RMB 540", value: "RMB540" },
        { label: "RMB 629", value: "RMB629" },
        { label: "RMB 640", value: "RMB640" },
        { label: "RMB 680", value: "RMB680" },
        { label: "RMB 729", value: "RMB729" }
    ] as SelectOption[];
}

// Row Per Page
export function OPTIONS_ROW_PER_PAGE() {
    return [
        { label: "10", value: "10" },
        { label: "25", value: "25" },
        { label: "50", value: "50" },
        { label: "100", value: "100" }
    ] as SelectOption[];
}

// Page No.
export function OPTIONS_PAGE_NO(totalPageNo: number) {
    const result = [] as SelectOption[];
    if (totalPageNo && totalPageNo > 0) {
        for (let i = 0; i < totalPageNo; i++) {
            const option = {
                label: (i + 1).toString(),
                value: (i + 1).toString()
            };
            result.push(option);
        }
    }
    return result;
}

export function markSelectedOption(selectedValue: string, options: SelectOption[]) {
    if (selectedValue && options) {
        const option = options.find(option => option.value === selectedValue);
        if (option) {
            option.isSelected = true;
        }
    }
}

export function markSelectedOptions(selectedValues: string[], options: SelectOption[]) {
    if (selectedValues && options) {
        options.forEach(option => {
            if (selectedValues.indexOf(option.value) > -1) {
                option.isSelected = true;
            }
        });
    }
}

export function getLabelByValue(value: string, options: SelectOption[]) {
    let result: string;
    if (options) {
        const option = options.find(option => option.value === value);
        if (option) {
            result = option.label;
        }
    }
    return result;
}

export function getLabelsByValues(values: string[], options: SelectOption[]) {
    const result: string[] = [];
    if (options) {
        values.forEach((value) => {
            const label = getLabelByValue(value, options);
            if (label) {
                result.push(label);
            }
        });
    }
    return result;
}

export function getFlattenedLabelsByValues(values: string[], options: SelectOption[]) {
    let result = "";
    if (values) {
        const labels = this.getLabelsByValues(values, options) as string[];
        if (labels) {
            labels.forEach((label, i) => {
                if (i == 0)
                    result = label;
                else
                    result += ", " + label;
            });
        }
    }
    return result;
}