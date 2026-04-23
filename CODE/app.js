App({
  globalData: {
    // 推荐结果在页面间传递（loading → result）
    recommendResult: null,
    aiExplanation: null,
    fromPath: 'survey', // 'survey' | 'upload'
  },

  onLaunch() {
    console.log('App launched');
  },
});
