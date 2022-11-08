module.exports = {
  compilers: {
    solc: {
      version: "0.8.0", // A version or constraint - Ex. "^0.5.0"
                         // Can also be set to "native" to use a native solc
      docker: true,      // Use a version obtained through docker
      parser: "solcjs",  // Leverages solc-js purely for speedy parsing
      evmVersion: "homestead" // Default: "petersburg"
    }
  }
}
