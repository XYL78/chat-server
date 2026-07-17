出口 默认 异步 功能 处理程序(req) {
  如果 (req.页眉.得到("升级")==="websocket") {
    ConstURL=新的 URL(req.URL);
    Const房间=URL.searchParams.得到("房间")||"默认";
    Const{ 插座, 响应 }=德诺.升级WebSocket(req);
    如果 (!全球的.客户) 全球的.客户=新的 Map();
    如果 (!全球的.客户.有(房间)) 全球的.客户.设置(房间, 新的 设置());
    ConstroomClients=全球的.客户.得到(房间);
    roomClients.添加(插座);
    插座.OnMessage=(事件)=>{
      roomClients.foreach((客户)=>{
        如果 (客户!==插座 && 客户.readyState===WebSocket.打开) {
          客户.发送(事件.数据);
        }
      });
    };
    插座.onClose=()=>{
      roomClients.删除(插座);
      如果 (roomClients.大小===0) 全球的.客户.删除(房间);
    };
    返回 响应;
  }
  返回 新的 响应("WebSocket服务器正在运行", { 状态: 200 });
}
出口 Const配置={ 运行时: "边缘" };
