async function main() {
  console.log(`Pull request reviewer`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
