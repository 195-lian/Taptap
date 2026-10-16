/**
 * platform/tapAdapter.js — TapTap / 预览平台适配
 * 业务只依赖注入接口，不直接摸 tt/document
 */

export function createStorageAdapter() {
  // 预览：内存 + 可选挂到 window.__SAVE__ 仅调试；真机用 tt
  const mem = new Map();
  return {
    getStorageSync(key) {
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        try {
          return tt.getStorageSync(key);
        } catch (e) {
          return null;
        }
      }
      return mem.get(key) || null;
    },
    setStorageSync(key, value) {
      if (typeof tt !== 'undefined' && tt.setStorageSync) {
        tt.setStorageSync(key, value);
        return;
      }
      mem.set(key, value);
    },
  };
}

export function createCloudAdapter() {
  return {
    async upload(key, data) {
      if (typeof tt !== 'undefined' && tt.setCloudStorage) {
        return new Promise((resolve, reject) => {
          tt.setCloudStorage({
            KVDataList: [{ key, value: JSON.stringify(data) }],
            success: resolve,
            fail: reject,
          });
        });
      }
      // 预览：写入内存模拟
      createCloudAdapter._mem = createCloudAdapter._mem || new Map();
      createCloudAdapter._mem.set(key, data);
      return true;
    },
    async download(key) {
      if (typeof tt !== 'undefined' && tt.getCloudStorage) {
        return new Promise((resolve, reject) => {
          tt.getCloudStorage({
            keyList: [key],
            success: (res) => {
              const item = res?.KVDataList?.find((x) => x.key === key);
              resolve(item ? JSON.parse(item.value) : null);
            },
            fail: reject,
          });
        });
      }
      createCloudAdapter._mem = createCloudAdapter._mem || new Map();
      return createCloudAdapter._mem.get(key) || null;
    },
  };
}

export function createAdAdapter() {
  return {
    async load() {
      // 真机：tt.createRewardedVideoAd 预加载
      await Promise.resolve();
      return true;
    },
    async show() {
      // 真机：show + onClose isEnded
      await new Promise((r) => setTimeout(r, 1500));
      return { isCompleted: true };
    },
  };
}
