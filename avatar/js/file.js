$(function () {
  // !# 2 cropper图片裁剪插件使用
  //获取裁剪区域的dom元素
  var $image = $('#image');
  //   配置选项
  const options = {
    //  从横比
    aspectRatio: 1,
    //  指定预览区域
    preview: '.img-preview',
  };
  // 创建裁剪区域
  //   $image.cropper(options);

  //  3、模拟点击
  $('#btnUpdate').on('click', function () {
    // $image.cropper(options);
    $('#files').click();
  });

  //4 监听图片(隐藏文件)的变化，也就是用户是否选择文件
  $('#files').on('change', function (e) {
    // 拿到用户选择的文件
    var file = e.target.files[0];
    // 根据选择的文件，创建一个对应的 URL 地址：
    var newImgURL = URL.createObjectURL(file);
    // 先销毁旧的裁剪区域，再重新设置图片路径，之后再创建``新``的``裁剪区域
    $image
      .cropper('destroy') // 销毁旧的裁剪区域
      .attr('src', newImgURL) // 重新设置图片路径
      .cropper(options); // 重新初始化裁剪区域
  });
  //  5 确定功能
  $('#uploadSuccess').on('click', function () {
    //5.1 将裁剪后的图片，输出为 base64 格式的字符串
    var dataURL = $image
      .cropper('getCroppedCanvas', {
        // 创建一个 Canvas 画布
        width: 100,
        height: 100,
      })
      .toDataURL('image/png'); // 将 Canvas 画布上的内容，转化为 base64 格式

    document.getElementById('avatar_img').src = dataURL;
    drawToCanvas(dataURL, document.getElementById('avatar_template').src);
    $('.upload-popup,.shadow-layer').fadeOut();
    // 5.2 裁剪后的图片发送到服务器
    // $.ajax({
    //   method: 'POST',
    //   url: 'xxxxx',
    //   data: { avatar: dataURL },
    //   success: function (res) {
    //     if (res.status !== 0) {
    //       return layer.msg('更新头像失败！');
    //     }
    //     // 更新头像成功后的操作
    //     layer.msg('更新头像成功！');
    //     // 头像更新成功后，调用父页面的方法来更新头像
    //     window.parent.getuserinfo();
    //   },
    // });
  });

  $('#upload').click(function () {
    $('.upload-popup,.shadow-layer').fadeIn();
  });

  $('.shadow-layer').click(function () {
    $('.upload-popup,.shadow-layer').fadeOut();
  });

  document.getElementById('download').onclick = function (ev) {
    if (document.getElementById('avatar_img').src == '')
      return alert('你还没选头像呢');

    var canvas = document.getElementById('cvs');
    var image = canvas.toDataURL('image/png');

    var save_link = document.createElement('a');
    save_link.href = image;
    save_link.download = 'avatar.png';

    var clickevent = document.createEvent('MouseEvents');
    clickevent.initEvent('click', true, false);
    save_link.dispatchEvent(clickevent);
  };

  document.getElementById('prev').onclick = function (ev) {
    var current = parseInt(document.getElementById('avatar_template').alt);
    current = (current - 1 + 4) % 4;
    document.getElementById('avatar_template').src =
      'img/head' + current + '.png';
    document.getElementById('avatar_template').alt = current;
    loadImage();
  };

  document.getElementById('next').onclick = function (ev) {
    var current = parseInt(document.getElementById('avatar_template').alt);
    current = (current + 1) % 4;
    document.getElementById('avatar_template').src =
      'img/head' + current + '.png';
    document.getElementById('avatar_template').alt = current;
    loadImage();
  };

  function loadImage() {
    if (document.getElementById('upload').files.length == 0) return;
    var imgUrl = window.URL.createObjectURL(
      document.getElementById('upload').files[0]
    );
    document.getElementById('avatar_img').src = imgUrl;
    drawToCanvas(imgUrl, document.getElementById('avatar_template').src);
  }

  function drawToCanvas(img1, img2) {
    var cvs = document.getElementById('cvs');
    var size = 300;
    cvs.width = size;
    cvs.height = size;
    var ctx = cvs.getContext('2d');
    var image1 = new Image();
    image1.src = img1;
    image1.onload = function () {
      var width =
        image1.width < image1.height
          ? size
          : size * (image1.width / image1.height);
      var height =
        image1.width > image1.height
          ? size
          : size * (image1.height / image1.width);
      var x =
        image1.width < image1.height
          ? 0
          : (size * (image1.width / image1.height) - size) / 2;
      var y =
        image1.width > image1.height
          ? 0
          : (size * (image1.height / image1.width) - size) / 2;

      document.getElementById('avatar_img').style.width = width + 'px';
      document.getElementById('avatar_img').style.height = height + 'px';
      document.getElementById('avatar_img').style.marginLeft = -x + 'px';
      document.getElementById('avatar_img').style.marginTop = -y + 'px';

      ctx.drawImage(image1, -x, -y, width, height);
      var image2 = new Image();
      image2.src = img2;
      image2.onload = function () {
        ctx.drawImage(image2, 0, 0, size, size);
      };
    };
  }
});
