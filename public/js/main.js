

document.getElementById('login-btn').addEventListener('click', function() {
  document.getElementById("modal").classList.add("add-block");
  console.log("クリックしたね");
});

document.getElementById('close').addEventListener('click', function() {
  document.getElementById("modal").classList.add("add-none");
});
