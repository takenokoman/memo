
  const socket = io();
  console.log("jsが読み込まれました");

  document.querySelector("#frm").addEventListener("submit", (e) => {

    e.preventDefault();

    console.log("フォームは送信されました");
    const msg = document.querySelector("#msg");
    if( msg.value === "" ){
      return(false);
    }

    socket.emit('post', {text: msg.value});

    msg.value = "";

  });



  socket.on('member-post', (msg) => {
    const chat = document.querySelector("#chat-li");
    const newchat = document.createElement("li");
    newchat.innerHTML = `${msg.text}`;
    chat.appendChild(newchat);
    const element = document.documentElement;
    const bottom = element.scrollHeight - element.clientHeight;
    window.scrollTo({
      top: bottom,
      behavior: 'smooth',
    });
  });


  window.onload = ()=>{
    // テキストボックスを選択する
    document.querySelector("#msg").focus();
  }
