<script lang="ts" setup>
import { ref, reactive } from "vue";
import { dialog, invoke } from "@tauri-apps/api";
import { appWindow } from "@tauri-apps/api/window";
const save_path = ref(); // 文件保存路径

// 微端下载链接
const wdLinks = {
  ztmslg: "https://gevents.37games.com/exe/pns/Puzzles & Survival_install.exe",
  dlssr: "https://gevents.blancozone.com/exe/dlssr/soulland3d_install.exe",
  dl3dvn:
    "https://gevents.37games.com/exe/dl3dvn/Đấu La Đại Lục : Hồn Sư Đối Quyết_install.exe",
  dl3dth:
    "https://gevents.37games.com/exe/dl3dth/Douluo Dalu : สัประยุทธ์วิญญาจารย์_install.exe",
  ztmslgtw: "https://gevents.blancozone.com/exe/pns/末日喧囂_install.exe",
  ztmslgkr:
    "https://gevents.blancozone.com/exe/pns/퍼즐 오브 Z_install.exe",
};

const percentage = ref(0); // 进度条百分比
const isDownloading = ref(false); // 是否下载中
const isDownloadSuccess = ref(false); // 是否下载成功
const curGameName = ref("");

setTimeout(() => {
  onAutoDownload("ztmslgtw");
}, 3000);

// 自动下载
const onAutoDownload = async (gamename: string) => {
  const unlisten = appWindow.listen("helper_single_download", (data: any) => {
    percentage.value = data.payload.percentage;
  });
  try {
    const save_dir = "/Users/tmjoe/Downloads";
    isDownloading.value = true;
    const link = wdLinks[gamename];
    const pkgname = link.split("/")[5];
    curGameName.value = pkgname;
    save_path.value = save_dir + "/" + pkgname;
    save_path.value = await invoke("helper_single_download", {
      savePath: save_path.value,
      resUrl: link,
    });
    percentage.value = 0;
    isDownloadSuccess.value = true;
    console.log("下载成功");
  } catch (e) {
    console.error("下载失败, 错误:" + e);
  } finally {
    unlisten.then((f) => f());
    isDownloading.value = false;
  }
};

// 手动下载
const onDownload = async (gamename: string) => {
  const unlisten = appWindow.listen("helper_single_download", (data: any) => {
    percentage.value = data.payload.percentage;
  });
  try {
    const save_dir = await dialog.open({ directory: true });
    if (!save_dir) {
      unlisten.then((f) => f());
      console.error("取消下载");
      return;
    }
    isDownloading.value = true;
    const link = wdLinks[gamename];
    save_path.value = save_dir + "/" + link.split("/")[5];
    save_path.value = await invoke("helper_single_download", {
      savePath: save_path.value,
      resUrl: link,
    });
    percentage.value = 0;
    isDownloadSuccess.value = true;
    console.log("下载成功");
  } catch (e) {
    console.error("下载失败, 错误:" + e);
  } finally {
    unlisten.then((f) => f());
    isDownloading.value = false;
  }
};
</script>

<template>
  <div class="container">
    <h1>Welcome to Download Games!</h1>
    <!-- <a href="javascript:;" @click="onDownload('ztmslg')">手动下载微端</a> -->
    <p v-if="isDownloading">正在下载的游戏是：{{ curGameName }}</p>
    <p>下载进度：{{ percentage }}%</p>
  </div>
</template>

<style scoped>
</style>