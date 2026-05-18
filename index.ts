
const server = Bun.serve({
    port: Bun.env.SERVER_PORT,
    fetch(request) {
        console.log(request);   
    }
});
