import { useNavigation } from "@react-navigation/native"
import { jwtDecode } from "jwt-decode"
import React, { useEffect, useState } from 'react'
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { useAuth } from "../../hooks/redux"
import { vouchersService } from "../services/vouchersService"
import type { Voucher } from "../types/index"

// Hàm trợ giúp để tạo các thuộc tính hiển thị cho voucher
const getVoucherDisplayProps = (voucher: Voucher) => {
  let title = "Voucher giảm giá"
  let textColor = "#ff6b6b" // Màu đỏ cam mặc định
  let color = "#ffebeb" // Nền hồng nhạt mặc định
  let isDashed = false

  // Tạo tiêu đề dựa trên loại giảm giá
  if (voucher.discount_type === "percentage") {
    title = `Giảm ${voucher.discount_value}%`
  } else if (voucher.discount_type === "fixed") {
    title = `Giảm ${voucher.discount_value} VND` // Giả sử đơn vị tiền tệ là VND
  }

  // Đặt màu sắc và kiểu đường viền dựa trên trạng thái
  switch (voucher.status) {
    case "active":
      textColor = "#28a745" // Xanh lá cây
      color = "#d4edda" // Nền xanh lá cây nhạt
      isDashed = false
      break
    case "expired":
      textColor = "#dc3545" // Đỏ
      color = "#f8d7da" // Nền đỏ nhạt
      isDashed = true // Hết hạn thì dùng đường viền đứt nét
      break
    case "inactive":
      textColor = "#6c757d" // Xám
      color = "#e2e3e5" // Nền xám nhạt
      isDashed = true // Không hoạt động thì dùng đường viền đứt nét
      break
    case "pending":
      textColor = "#ffc107" // Vàng cam
      color = "#fff3cd" // Nền vàng nhạt
      isDashed = false
      break
    default:
      // Giữ màu mặc định
      break
  }

  return { title, textColor, color, isDashed }
}

const VoucherScreen = () => {
  const navigation = useNavigation<any>()
  const { token } = useAuth()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)

  // Lấy role từ token và kiểm tra đăng nhập
  useEffect(() => {
    if (!token || token === "null") {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để xem voucher.", [
        { text: "OK", onPress: () => navigation.navigate("LoginScreen") },
      ])
      return
    }
    try {
      const decoded: any = jwtDecode(token)
      setRole(decoded.role || null)
      console.log("Decoded role:", decoded.role) // Debug role
    } catch (error) {
      console.error("Error decoding token:", error)
      setRole(null)
    }
  }, [token, navigation])

  // Gọi API lấy danh sách voucher
  useEffect(() => {
    if (!token || token === "null") {
      setLoading(false)
      return
    }

    const fetchVouchers = async () => {
      setLoading(true)
      try {
        const response = await vouchersService.getVouchers({}, role === "Admin")
        console.log("Voucher API Response:", response) // Debug API response
        setVouchers(
          Array.isArray(response.data)
            ? response.data.filter((voucher) => role === "Admin" || voucher.status === "active")
            : [],
        )
      } catch (error: any) {
        console.error("Voucher API Error:", error.response?.data || error.message)
        Alert.alert("Lỗi", error?.response?.data?.message || "Không thể tải danh sách voucher.")
      } finally {
        setLoading(false)
      }
    }

    fetchVouchers()
  }, [token, role])

  // Lấy userId từ token
  const getUserIdFromToken = (token: string) => {
    try {
      const decoded: any = jwtDecode(token)
      return decoded.id || decoded.userId
    } catch {
      return null
    }
  }

  // Xử lý lưu voucher
  const handleSaveVoucher = async (voucherId: string) => {
    if (!token) return

    try {
      const response = await vouchersService.saveVoucher(voucherId)
      console.log("Save Response:", response) // Debug save response
      Alert.alert("Thành công", response.message)
    } catch (error: any) {
      console.error("Save Error:", error.response?.data || error.message)
      Alert.alert("Lỗi", error?.response?.data?.message || "Không thể lưu voucher.")
    }
  }

  // Chuyển đổi trạng thái voucher sang tiếng Việt
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Đang hoạt động"
      case "inactive":
        return "Không hoạt động"
      case "pending":
        return "Đang chờ xử lý"
      case "expired":
        return "Hết hạn"
      default:
        return "Không xác định"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>VOUCHER</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconCircle}>
            <Icon name="list" size={16} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle}>
            <View style={styles.notificationDot} />
            <Icon name="ellipsis-horizontal" size={16} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle}>
            <Icon name="settings-outline" size={16} color="#007aff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nội dung danh sách voucher */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 40 }}>Đang tải...</Text>
        ) : vouchers.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 40 }}>Không có voucher.</Text>
        ) : (
          vouchers.map((voucher) => {
            const userId = token ? getUserIdFromToken(token) : null
            const isCollected = userId ? voucher.saved_by_users?.includes(userId) : false

            // Lấy các thuộc tính hiển thị từ hàm trợ giúp
            const { title, textColor, color, isDashed } = getVoucherDisplayProps(voucher)

            return (
              <View
                key={voucher._id}
                style={[
                  styles.voucherCard,
                  {
                    borderColor: textColor, // Sử dụng textColor đã tính toán
                    backgroundColor: color, // Sử dụng color đã tính toán
                    borderStyle: isDashed ? "dashed" : "solid", // Sử dụng isDashed đã tính toán
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.voucherTitle, { color: textColor }]}>{title}</Text>
                  <View style={[styles.validTag, { backgroundColor: textColor }]}>
                    <Text style={styles.validText}>
                      Hạn: {voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString() : "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.discountRow}>
                  <View style={[styles.lockIcon, { backgroundColor: textColor }]}>
                    <Icon name="lock-closed" size={12} color="#fff" />
                  </View>
                  <Text style={styles.discountText}>
                    {voucher.discount_type === "percentage"
                      ? `${voucher.discount_value || 0}% off`
                      : `${voucher.discount_value || 0} off`}
                  </Text>
                </View>

                <Text style={styles.statusText}>{getStatusText(voucher.status || "")}</Text>

                {role !== "Admin" && (
                  <TouchableOpacity
                    style={[styles.collectBtn, { backgroundColor: textColor }]}
                    onPress={() => handleSaveVoucher(voucher._id)}
                    disabled={isCollected}
                  >
                    <Text style={styles.collectBtnText}>{isCollected ? "Đã lưu" : "Lưu"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default VoucherScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconCircle: {
    backgroundColor: "#e8f4ff",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "#007aff",
    borderRadius: 4,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  voucherCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: "relative",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  voucherTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  validTag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  validText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  lockIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  discountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  statusText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  collectBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  collectBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
})
