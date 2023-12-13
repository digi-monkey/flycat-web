echo "Pulling submodules..."
git submodule update --init --recursive

echo "Installing Rustup..."
# Install Rustup (compiler)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# Adding binaries to path
source "$HOME/.cargo/env"

echo "Installing wasm-pack..."
# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -y

echo "Building wasm..."
wasm-pack build wasm/ --target web

echo "Bump wasm pkg version.."
yarn upgrade wasm

echo "Installation script completed."
