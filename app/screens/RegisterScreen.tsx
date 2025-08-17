import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/Feather';

// Import Redux hooks và actions
import { useAuth } from '../../hooks/redux';
import { clearError, registerUser } from '../redux/slices/authSlice';

const { width } = Dimensions.get('window');

const countryList = [
  { cca2: 'AF', callingCode: ['93'], name: 'Afghanistan' },
  { cca2: 'AL', callingCode: ['355'], name: 'Albania' },
  { cca2: 'DZ', callingCode: ['213'], name: 'Algeria' },
  { cca2: 'AD', callingCode: ['376'], name: 'Andorra' },
  { cca2: 'AO', callingCode: ['244'], name: 'Angola' },
  { cca2: 'AR', callingCode: ['54'], name: 'Argentina' },
  { cca2: 'AM', callingCode: ['374'], name: 'Armenia' },
  { cca2: 'AU', callingCode: ['61'], name: 'Australia' },
  { cca2: 'AT', callingCode: ['43'], name: 'Austria' },
  { cca2: 'AZ', callingCode: ['994'], name: 'Azerbaijan' },
  { cca2: 'BS', callingCode: ['1'], name: 'Bahamas' },
  { cca2: 'BH', callingCode: ['973'], name: 'Bahrain' },
  { cca2: 'BD', callingCode: ['880'], name: 'Bangladesh' },
  { cca2: 'BB', callingCode: ['1'], name: 'Barbados' },
  { cca2: 'BY', callingCode: ['375'], name: 'Belarus' },
  { cca2: 'BE', callingCode: ['32'], name: 'Belgium' },
  { cca2: 'BZ', callingCode: ['501'], name: 'Belize' },
  { cca2: 'BJ', callingCode: ['229'], name: 'Benin' },
  { cca2: 'BT', callingCode: ['975'], name: 'Bhutan' },
  { cca2: 'BO', callingCode: ['591'], name: 'Bolivia' },
  { cca2: 'BA', callingCode: ['387'], name: 'Bosnia and Herzegovina' },
  { cca2: 'BW', callingCode: ['267'], name: 'Botswana' },
  { cca2: 'BR', callingCode: ['55'], name: 'Brazil' },
  { cca2: 'BN', callingCode: ['673'], name: 'Brunei' },
  { cca2: 'BG', callingCode: ['359'], name: 'Bulgaria' },
  { cca2: 'BF', callingCode: ['226'], name: 'Burkina Faso' },
  { cca2: 'BI', callingCode: ['257'], name: 'Burundi' },
  { cca2: 'KH', callingCode: ['855'], name: 'Cambodia' },
  { cca2: 'CM', callingCode: ['237'], name: 'Cameroon' },
  { cca2: 'CA', callingCode: ['1'], name: 'Canada' },
  { cca2: 'CV', callingCode: ['238'], name: 'Cape Verde' },
  { cca2: 'KY', callingCode: ['1'], name: 'Cayman Islands' },
  { cca2: 'CF', callingCode: ['236'], name: 'Central African Republic' },
  { cca2: 'TD', callingCode: ['235'], name: 'Chad' },
  { cca2: 'CL', callingCode: ['56'], name: 'Chile' },
  { cca2: 'CN', callingCode: ['86'], name: 'China' },
  { cca2: 'CO', callingCode: ['57'], name: 'Colombia' },
  { cca2: 'KM', callingCode: ['269'], name: 'Comoros' },
  { cca2: 'CG', callingCode: ['242'], name: 'Congo' },
  { cca2: 'CD', callingCode: ['243'], name: 'Congo, Democratic Republic of the' },
  { cca2: 'CR', callingCode: ['506'], name: 'Costa Rica' },
  { cca2: 'HR', callingCode: ['385'], name: 'Croatia' },
  { cca2: 'CU', callingCode: ['53'], name: 'Cuba' },
  { cca2: 'CY', callingCode: ['357'], name: 'Cyprus' },
  { cca2: 'CZ', callingCode: ['420'], name: 'Czech Republic' },
  { cca2: 'DK', callingCode: ['45'], name: 'Denmark' },
  { cca2: 'DJ', callingCode: ['253'], name: 'Djibouti' },
  { cca2: 'DM', callingCode: ['1'], name: 'Dominica' },
  { cca2: 'DO', callingCode: ['1'], name: 'Dominican Republic' },
  { cca2: 'EC', callingCode: ['593'], name: 'Ecuador' },
  { cca2: 'EG', callingCode: ['20'], name: 'Egypt' },
  { cca2: 'SV', callingCode: ['503'], name: 'El Salvador' },
  { cca2: 'GQ', callingCode: ['240'], name: 'Equatorial Guinea' },
  { cca2: 'ER', callingCode: ['291'], name: 'Eritrea' },
  { cca2: 'EE', callingCode: ['372'], name: 'Estonia' },
  { cca2: 'SZ', callingCode: ['268'], name: 'Eswatini' },
  { cca2: 'ET', callingCode: ['251'], name: 'Ethiopia' },
  { cca2: 'FJ', callingCode: ['679'], name: 'Fiji' },
  { cca2: 'FI', callingCode: ['358'], name: 'Finland' },
  { cca2: 'FR', callingCode: ['33'], name: 'France' },
  { cca2: 'GA', callingCode: ['241'], name: 'Gabon' },
  { cca2: 'GM', callingCode: ['220'], name: 'Gambia' },
  { cca2: 'GE', callingCode: ['995'], name: 'Georgia' },
  { cca2: 'DE', callingCode: ['49'], name: 'Germany' },
  { cca2: 'GH', callingCode: ['233'], name: 'Ghana' },
  { cca2: 'GR', callingCode: ['30'], name: 'Greece' },
  { cca2: 'GD', callingCode: ['1'], name: 'Grenada' },
  { cca2: 'GT', callingCode: ['502'], name: 'Guatemala' },
  { cca2: 'GN', callingCode: ['224'], name: 'Guinea' },
  { cca2: 'GW', callingCode: ['245'], name: 'Guinea-Bissau' },
  { cca2: 'GY', callingCode: ['592'], name: 'Guyana' },
  { cca2: 'HT', callingCode: ['509'], name: 'Haiti' },
  { cca2: 'HN', callingCode: ['504'], name: 'Honduras' },
  { cca2: 'HU', callingCode: ['36'], name: 'Hungary' },
  { cca2: 'IS', callingCode: ['354'], name: 'Iceland' },
  { cca2: 'IN', callingCode: ['91'], name: 'India' },
  { cca2: 'ID', callingCode: ['62'], name: 'Indonesia' },
  { cca2: 'IR', callingCode: ['98'], name: 'Iran' },
  { cca2: 'IQ', callingCode: ['964'], name: 'Iraq' },
  { cca2: 'IE', callingCode: ['353'], name: 'Ireland' },
  { cca2: 'IL', callingCode: ['972'], name: 'Israel' },
  { cca2: 'IT', callingCode: ['39'], name: 'Italy' },
  { cca2: 'CI', callingCode: ['225'], name: 'Ivory Coast' },
  { cca2: 'JM', callingCode: ['1'], name: 'Jamaica' },
  { cca2: 'JP', callingCode: ['81'], name: 'Japan' },
  { cca2: 'JO', callingCode: ['962'], name: 'Jordan' },
  { cca2: 'KZ', callingCode: ['7'], name: 'Kazakhstan' },
  { cca2: 'KE', callingCode: ['254'], name: 'Kenya' },
  { cca2: 'KI', callingCode: ['686'], name: 'Kiribati' },
  { cca2: 'KR', callingCode: ['82'], name: 'South Korea' },
  { cca2: 'KW', callingCode: ['965'], name: 'Kuwait' },
  { cca2: 'KG', callingCode: ['996'], name: 'Kyrgyzstan' },
  { cca2: 'LA', callingCode: ['856'], name: 'Laos' },
  { cca2: 'LV', callingCode: ['371'], name: 'Latvia' },
  { cca2: 'LB', callingCode: ['961'], name: 'Lebanon' },
  { cca2: 'LS', callingCode: ['266'], name: 'Lesotho' },
  { cca2: 'LR', callingCode: ['231'], name: 'Liberia' },
  { cca2: 'LY', callingCode: ['218'], name: 'Libya' },
  { cca2: 'LI', callingCode: ['423'], name: 'Liechtenstein' },
  { cca2: 'LT', callingCode: ['370'], name: 'Lithuania' },
  { cca2: 'LU', callingCode: ['352'], name: 'Luxembourg' },
  { cca2: 'MO', callingCode: ['853'], name: 'Macau' },
  { cca2: 'MG', callingCode: ['261'], name: 'Madagascar' },
  { cca2: 'MW', callingCode: ['265'], name: 'Malawi' },
  { cca2: 'MY', callingCode: ['60'], name: 'Malaysia' },
  { cca2: 'MV', callingCode: ['960'], name: 'Maldives' },
  { cca2: 'ML', callingCode: ['223'], name: 'Mali' },
  { cca2: 'MT', callingCode: ['356'], name: 'Malta' },
  { cca2: 'MH', callingCode: ['692'], name: 'Marshall Islands' },
  { cca2: 'MQ', callingCode: ['596'], name: 'Martinique' },
  { cca2: 'MR', callingCode: ['222'], name: 'Mauritania' },
  { cca2: 'MU', callingCode: ['230'], name: 'Mauritius' },
  { cca2: 'YT', callingCode: ['262'], name: 'Mayotte' },
  { cca2: 'MX', callingCode: ['52'], name: 'Mexico' },
  { cca2: 'FM', callingCode: ['691'], name: 'Micronesia' },
  { cca2: 'MD', callingCode: ['373'], name: 'Moldova' },
  { cca2: 'MC', callingCode: ['377'], name: 'Monaco' },
  { cca2: 'MN', callingCode: ['976'], name: 'Mongolia' },
  { cca2: 'ME', callingCode: ['382'], name: 'Montenegro' },
  { cca2: 'MA', callingCode: ['212'], name: 'Morocco' },
  { cca2: 'MZ', callingCode: ['258'], name: 'Mozambique' },
  { cca2: 'MM', callingCode: ['95'], name: 'Myanmar' },
  { cca2: 'NA', callingCode: ['264'], name: 'Namibia' },
  { cca2: 'NR', callingCode: ['674'], name: 'Nauru' },
  { cca2: 'NP', callingCode: ['977'], name: 'Nepal' },
  { cca2: 'NL', callingCode: ['31'], name: 'Netherlands' },
  { cca2: 'NC', callingCode: ['687'], name: 'New Caledonia' },
  { cca2: 'NZ', callingCode: ['64'], name: 'New Zealand' },
  { cca2: 'NI', callingCode: ['505'], name: 'Nicaragua' },
  { cca2: 'NE', callingCode: ['227'], name: 'Niger' },
  { cca2: 'NG', callingCode: ['234'], name: 'Nigeria' },
  { cca2: 'NU', callingCode: ['683'], name: 'Niue' },
  { cca2: 'NF', callingCode: ['672'], name: 'Norfolk Island' },
  { cca2: 'MP', callingCode: ['1'], name: 'Northern Mariana Islands' },
  { cca2: 'NO', callingCode: ['47'], name: 'Norway' },
  { cca2: 'OM', callingCode: ['968'], name: 'Oman' },
  { cca2: 'PK', callingCode: ['92'], name: 'Pakistan' },
  { cca2: 'PW', callingCode: ['680'], name: 'Palau' },
  { cca2: 'PS', callingCode: ['970'], name: 'Palestinian Territories' },
  { cca2: 'PA', callingCode: ['507'], name: 'Panama' },
  { cca2: 'PG', callingCode: ['675'], name: 'Papua New Guinea' },
  { cca2: 'PY', callingCode: ['595'], name: 'Paraguay' },
  { cca2: 'PE', callingCode: ['51'], name: 'Peru' },
  { cca2: 'PH', callingCode: ['63'], name: 'Philippines' },
  { cca2: 'PL', callingCode: ['48'], name: 'Poland' },
  { cca2: 'PT', callingCode: ['351'], name: 'Portugal' },
  { cca2: 'PR', callingCode: ['1'], name: 'Puerto Rico' },
  { cca2: 'QA', callingCode: ['974'], name: 'Qatar' },
  { cca2: 'RO', callingCode: ['40'], name: 'Romania' },
  { cca2: 'RU', callingCode: ['7'], name: 'Russia' },
  { cca2: 'RW', callingCode: ['250'], name: 'Rwanda' },
  { cca2: 'RE', callingCode: ['262'], name: 'Réunion' },
  { cca2: 'BL', callingCode: ['590'], name: 'Saint Barthélemy' },
  { cca2: 'SH', callingCode: ['290'], name: 'Saint Helena' },
  { cca2: 'KN', callingCode: ['1'], name: 'Saint Kitts and Nevis' },
  { cca2: 'LC', callingCode: ['1'], name: 'Saint Lucia' },
  { cca2: 'MF', callingCode: ['590'], name: 'Saint Martin' },
  { cca2: 'PM', callingCode: ['508'], name: 'Saint Pierre and Miquelon' },
  { cca2: 'VC', callingCode: ['1'], name: 'Saint Vincent and the Grenadines' },
  { cca2: 'WS', callingCode: ['685'], name: 'Samoa' },
  { cca2: 'SM', callingCode: ['378'], name: 'San Marino' },
  { cca2: 'ST', callingCode: ['239'], name: 'São Tomé and Príncipe' },
  { cca2: 'SA', callingCode: ['966'], name: 'Saudi Arabia' },
  { cca2: 'SN', callingCode: ['221'], name: 'Senegal' },
  { cca2: 'RS', callingCode: ['381'], name: 'Serbia' },
  { cca2: 'SC', callingCode: ['248'], name: 'Seychelles' },
  { cca2: 'SL', callingCode: ['232'], name: 'Sierra Leone' },
  { cca2: 'SG', callingCode: ['65'], name: 'Singapore' },
  { cca2: 'SX', callingCode: ['1'], name: 'Sint Maarten' },
  { cca2: 'SK', callingCode: ['421'], name: 'Slovakia' },
  { cca2: 'SI', callingCode: ['386'], name: 'Slovenia' },
  { cca2: 'SB', callingCode: ['677'], name: 'Solomon Islands' },
  { cca2: 'SO', callingCode: ['252'], name: 'Somalia' },
  { cca2: 'ZA', callingCode: ['27'], name: 'South Africa' },
  { cca2: 'GS', callingCode: ['500'], name: 'South Georgia and the South Sandwich Islands' },
  { cca2: 'SS', callingCode: ['211'], name: 'South Sudan' },
  { cca2: 'ES', callingCode: ['34'], name: 'Spain' },
  { cca2: 'LK', callingCode: ['94'], name: 'Sri Lanka' },
  { cca2: 'SD', callingCode: ['249'], name: 'Sudan' },
  { cca2: 'SR', callingCode: ['597'], name: 'Suriname' },
  { cca2: 'SJ', callingCode: ['47'], name: 'Svalbard and Jan Mayen' },
  { cca2: 'SE', callingCode: ['46'], name: 'Sweden' },
  { cca2: 'CH', callingCode: ['41'], name: 'Switzerland' },
  { cca2: 'SY', callingCode: ['963'], name: 'Syria' },
  { cca2: 'TW', callingCode: ['886'], name: 'Taiwan' },
  { cca2: 'TJ', callingCode: ['992'], name: 'Tajikistan' },
  { cca2: 'TZ', callingCode: ['255'], name: 'Tanzania' },
  { cca2: 'TH', callingCode: ['66'], name: 'Thailand' },
  { cca2: 'TL', callingCode: ['670'], name: 'Timor-Leste' },
  { cca2: 'TG', callingCode: ['228'], name: 'Togo' },
  { cca2: 'TK', callingCode: ['690'], name: 'Tokelau' },
  { cca2: 'TO', callingCode: ['676'], name: 'Tonga' },
  { cca2: 'TT', callingCode: ['1'], name: 'Trinidad and Tobago' },
  { cca2: 'TN', callingCode: ['216'], name: 'Tunisia' },
  { cca2: 'TR', callingCode: ['90'], name: 'Turkey' },
  { cca2: 'TM', callingCode: ['993'], name: 'Turkmenistan' },
  { cca2: 'TC', callingCode: ['1'], name: 'Turks and Caicos Islands' },
  { cca2: 'TV', callingCode: ['688'], name: 'Tuvalu' },
  { cca2: 'UG', callingCode: ['256'], name: 'Uganda' },
  { cca2: 'UA', callingCode: ['380'], name: 'Ukraine' },
  { cca2: 'AE', callingCode: ['971'], name: 'United Arab Emirates' },
  { cca2: 'GB', callingCode: ['44'], name: 'United Kingdom' },
  { cca2: 'US', callingCode: ['1'], name: 'United States' },
  { cca2: 'UY', callingCode: ['598'], name: 'Uruguay' },
  { cca2: 'UZ', callingCode: ['998'], name: 'Uzbekistan' },
  { cca2: 'VU', callingCode: ['678'], name: 'Vanuatu' },
  { cca2: 'VE', callingCode: ['58'], name: 'Venezuela' },
  { cca2: 'VN', callingCode: ['84'], name: 'Vietnam' },
  { cca2: 'WF', callingCode: ['681'], name: 'Wallis and Futuna' },
  { cca2: 'EH', callingCode: ['212'], name: 'Western Sahara' },
  { cca2: 'YE', callingCode: ['967'], name: 'Yemen' },
  { cca2: 'ZM', callingCode: ['260'], name: 'Zambia' },
  { cca2: 'ZW', callingCode: ['263'], name: 'Zimbabwe' }
];

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Redux state
  const { isLoading, error, token, dispatch } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    cca2: 'VN',
    callingCode: ['84'],
    name: 'Vietnam',
  });

  useEffect(() => {
    if (token) {
      navigation.navigate('app' as never);
    }
  }, [token, navigation]);

  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi đăng ký', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [error, dispatch]);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, email, password, phone } = formData;

    if (!name.trim()) {
      Alert.alert('Lỗi xác thực', 'Vui lòng nhập tên của bạn');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Lỗi xác thực', 'Vui lòng nhập email của bạn');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi xác thực', 'Vui lòng nhập địa chỉ email hợp lệ');
      return false;
    }

    if (!password) {
      Alert.alert('Lỗi xác thực', 'Vui lòng nhập mật khẩu của bạn');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi xác thực', 'Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const { name, email, password, phone } = formData;

    const fullPhone = phone.trim() ? `+${selectedCountry.callingCode[0]}${phone}` : undefined;

    const registerData = {
      username: name.trim(),
      email: email.trim(),
      password,
      phone: fullPhone,
      role: 'User',
    };

    try {
      await dispatch(registerUser(registerData)).unwrap();
      // Navigate to OTP screen for registration verification
      navigation.navigate('OtpVerification', {
        mode: 'register',
        email: registerData.email,
      } as never);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Đăng Ký</Text>
          <Image
            source={require('@/assets/images/signup.png')}
            style={styles.illustration}
          />
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            placeholderTextColor="#C0C0C0"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#C0C0C0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            editable={!isLoading}
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mật khẩu"
              placeholderTextColor="#C0C0C0"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Icon
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#C0C0C0"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.phoneWrapper}>
            <View style={styles.countryButton}>
              <CountryPicker
                countryCode={selectedCountry.cca2 as any}
                withFilter
                withFlag
                withCallingCode
                withAlphaFilter
                onSelect={handleCountrySelect}
                countryList={countryList} // Sử dụng danh sách tĩnh
                visible={false}
              />
              <Text style={styles.countryText}>
                {selectedCountry.cca2} (+{selectedCountry.callingCode[0]})
              </Text>
              <Icon name="chevron-down" size={16} color="#C0C0C0" style={{ marginLeft: 4 }} />
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Số điện thoại"
              placeholderTextColor="#C0C0C0"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.buttonPrimary, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Tiếp tục</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelContainer}
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text style={[styles.cancelText, isLoading && styles.disabledText]}>
              Tôi đã có tài khoản
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  illustration: {
    width: 180,
    height: 180,
    marginRight: -10, // Đẩy ảnh sát lề phải
  },

  formContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 70,
  },
  input: {
    height: 48,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginTop: 16,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  phoneWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    marginTop: 16,

  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 6,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 10,
    fontWeight: '500'
  },

  buttonPrimary: {
    height: 50,
    backgroundColor: '#0066FF',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#A0BFFF',
  },

  cancelContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600'
  },
  disabledText: {
    color: '#C0C0C0',
  },
});