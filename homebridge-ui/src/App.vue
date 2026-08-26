<template>
  <div class="card p-4 m-3">
    <h3 class="card-title text-primary mb-3">Samsung Tizen Plugin</h3>
    <p class="card-text">Hello World din Vue 3 + Vite! SPA-ul funcționează fără erori 404.</p>

    <div class="mt-3">
      <button class="btn btn-primary" @click="testHomebridge">Test API Homebridge</button>
    </div>
  </div>
</template>

<script setup>
async function testHomebridge() {
  if (window.homebridge) {
    const config = await window.homebridge.getPluginConfig();
    window.homebridge.toast.success('Conexiune reușită cu Homebridge UI!');
    console.log('Configurația curentă:', config);
  } else {
    alert('Aplicația rulează în afara Homebridge UI.');
  }
}
</script>
