Page({
  data: {
    file: null,
    fileType: '', // 'image' | 'pdf'
    fileSizeText: '',
  },

  onChooseFile() {
    // 先弹出选择菜单
    wx.showActionSheet({
      itemList: ['选择图片（相册或拍照）', '选择 PDF 文件'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this._chooseImage();
        } else {
          this._choosePDF();
        }
      },
    });
  },

  _chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const item = res.tempFiles[0];
        if (item.size > 5 * 1024 * 1024) {
          wx.showToast({ title: '图片不能超过 5MB', icon: 'none' });
          return;
        }
        this.setData({
          file: { path: item.tempFilePath, name: '体检报告图片', size: item.size },
          fileType: 'image',
          fileSizeText: this._formatSize(item.size),
        });
      },
    });
  },

  _choosePDF() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const item = res.tempFiles[0];
        if (item.size > 2 * 1024 * 1024) {
          wx.showToast({ title: 'PDF 不能超过 2MB', icon: 'none' });
          return;
        }
        this.setData({
          file: { path: item.path, name: item.name, size: item.size },
          fileType: 'pdf',
          fileSizeText: this._formatSize(item.size),
        });
      },
      fail: () => {
        wx.showToast({ title: '请从聊天文件中选择 PDF', icon: 'none' });
      },
    });
  },

  onReselect(e) {
    e.stopPropagation();
    this.setData({ file: null, fileType: '', fileSizeText: '' });
  },

  onCatchTap() {},

  onSubmit() {
    const { file } = this.data;
    if (!file) return;

    const app = getApp();
    app.globalData.fromPath = 'upload';
    app.globalData.pendingFile = file;

    wx.redirectTo({
      url: '/pages/loading/loading?type=upload',
    });
  },

  goToSurvey() {
    wx.navigateTo({ url: '/pages/survey/survey' });
  },

  _formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  },
});
