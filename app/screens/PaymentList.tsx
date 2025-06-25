import { Alert, Button, Linking, View } from 'react-native';

const PaymentScreen = () => {
    // Danh sách các URL server có thể kết nối
    const SERVER_URLS = [
        'http://10.0.2.2:5000',      // Cho máy ảo Android thông thường
        'http://127.0.0.1:5000',     // Localhost
        'http://192.168.0.102:5000', // IP máy thật (thay đổi theo IP của bạn)
        'http://localhost:5000'      // Cho web
    ];

    const handleVNPAYPayment = async () => {
        let lastError = null;

        // Thử kết nối với tất cả các URL cho đến khi thành công
        for (const serverUrl of SERVER_URLS) {
            try {
                console.log('Trying to connect to:', serverUrl);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // Giảm timeout xuống 5 giây
                
                const response = await fetch(`${serverUrl}/create-vnpay-payment`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ amount: 100000 }), // 100,000 VND
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }
                
                const data = await response.json();
                console.log('API response data:', data);
                
                if (!data.paymentUrl) {
                    throw new Error('Payment URL not received from server');
                }
                
                console.log('Payment URL:', data.paymentUrl);
                const supported = await Linking.canOpenURL(data.paymentUrl);
                console.log('Can open URL:', supported);
                
                if (supported) {
                    await Linking.openURL(data.paymentUrl);
                    return; // Thoát khỏi hàm nếu thành công
                } else {
                    throw new Error('Không thể mở URL thanh toán');
                }
            } catch (error) {
                const err = error as Error;
                console.log('Failed to connect to', serverUrl, 'Error:', err.message);
                lastError = err;
                // Tiếp tục thử URL tiếp theo
                continue;
            }
        }

        // Nếu đã thử tất cả các URL mà vẫn thất bại
        console.log('All connection attempts failed. Last error:', {
            message: lastError?.message,
            stack: lastError?.stack,
            name: lastError?.name
        });

        // Hiển thị thông báo lỗi
        let errorMessage = 'Không thể kết nối đến máy chủ thanh toán. Vui lòng kiểm tra:\n\n' +
                         '1. Máy chủ đã được khởi động\n' +
                         '2. Kết nối mạng hoạt động\n' +
                         '3. Địa chỉ IP và cổng chính xác\n\n';
        
        if (lastError?.name === 'AbortError') {
            errorMessage += 'Lỗi: Kết nối bị timeout sau 5 giây';
        } else {
            errorMessage += 'Chi tiết lỗi: ' + lastError?.message;
        }
        
        Alert.alert('Lỗi Thanh Toán', errorMessage);
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Button title="Thanh toán qua VNPAY" onPress={handleVNPAYPayment} />
        </View>
    );
};

export default PaymentScreen;