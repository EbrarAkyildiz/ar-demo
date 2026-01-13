<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Web AR GPS Demo</title>
  <style>
    html, body { margin:0; height:100%; background:#000; }
    #canvas { position:fixed; inset:0; }
    #info { position:fixed; top:10px; left:50%; transform:translateX(-50%);
            background:#222; color:#fff; padding:8px 12px; border-radius:8px; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="info">Konum kontrol ediliyor…</div>
  <script type="module" src="main.js"></script>
</body>
</html>
