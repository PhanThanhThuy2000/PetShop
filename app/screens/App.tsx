import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import PaymentScreen from './PaymentScreen';

const App = () => {
    useEffect(() => {
        const handleDeepLink = ({ url }: { url: string }) => {
            if (url.includes('payment-result')) {
                const params = new URLSearchParams(url.split('?')[1]);
                const status = params.get('vnp_TransactionStatus');
                const message = status === '00' ? 'Thanh toán thành công' : 'Thanh toán thất bại';
                Alert.alert('Kết quả thanh toán', message);
            }
        };

        Linking.addEventListener('url', handleDeepLink);
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        return () => Linking.removeAllListeners('url');
    }, []);

    return <PaymentScreen />;
};

export default App;