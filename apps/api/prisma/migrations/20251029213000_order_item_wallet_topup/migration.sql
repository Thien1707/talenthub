-- Cho phép đơn hàng nạp ví (WALLET_TOPUP) trên order_items.item_type
ALTER TABLE `order_items`
  MODIFY `item_type` ENUM('NORMAL_POST', 'VIP_UPGRADE', 'PACKAGE', 'WALLET_TOPUP') NOT NULL;
