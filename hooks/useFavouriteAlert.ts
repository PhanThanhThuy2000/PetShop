// app/hooks/useFavouriteAlert.ts
import { useState } from 'react';

interface AlertConfig {
    visible: boolean;
    type: 'add' | 'remove';
    itemName: string;
    itemImage?: any;
    onConfirm: () => void;
}

export const useFavouriteAlert = () => {
    const [alertConfig, setAlertConfig] = useState<AlertConfig>({
        visible: false,
        type: 'add',
        itemName: '',
        onConfirm: () => { },
    });

    const showRemoveAlert = (
        itemName: string,
        itemImage: any,
        onConfirm: () => void
    ) => {
        setAlertConfig({
            visible: true,
            type: 'remove',
            itemName,
            itemImage,
            onConfirm,
        });
    };

    const showAddAlert = (
        itemName: string,
        itemImage: any,
        onConfirm: () => void
    ) => {
        setAlertConfig({
            visible: true,
            type: 'add',
            itemName,
            itemImage,
            onConfirm,
        });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({
            ...prev,
            visible: false
        }));
    };

    return {
        alertConfig,
        showRemoveAlert,
        showAddAlert,
        hideAlert,
    };
};