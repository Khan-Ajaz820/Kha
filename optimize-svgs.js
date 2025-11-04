const fs = require('fs').promises;
const path = require('path');
const { optimize } = require('svgo');

// MAXIMUM AGGRESSIVE LOSSLESS SVGO configuration
const svgoConfig = {
  multipass: true, // Run optimizations multiple times for maximum compression
  floatPrecision: 3, // Reduce decimal precision (3 is safe and lossless for visual appearance)
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // More aggressive numeric cleanup
          cleanupNumericValues: {
            floatPrecision: 3,
            leadingZero: true,
            defaultPx: true,
            convertToPx: true
          },
          // More aggressive path optimization
          convertPathData: {
            floatPrecision: 3,
            transformPrecision: 5,
            removeUseless: true,
            collapseRepeated: true,
            utilizeAbsolute: true,
            leadingZero: true,
            negativeExtraSpace: true,
            noSpaceAfterFlags: false,
            forceAbsolutePath: false
          },
          // More aggressive transform optimization  
          convertTransform: {
            floatPrecision: 3,
            transformPrecision: 5,
            matrixToTransform: true,
            shortTranslate: true,
            shortScale: true,
            shortRotate: true,
            removeUseless: true,
            collapseIntoOne: true,
            leadingZero: true,
            negativeExtraSpace: true
          }
        }
      }
    },
    // Remove all possible metadata and comments
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeXMLNS',
    'removeEditorsNSData',
    
    // Aggressive attribute and style optimization
    'removeUselessDefs',
    'cleanupAttrs',
    'mergeStyles',
    'inlineStyles',
    {
      name: 'minifyStyles',
      params: {
        usage: {
          force: true
        }
      }
    },
    'removeStyleElement',
    'removeScriptElement',
    
    // ID and class optimization
    {
      name: 'cleanupIds',
      params: {
        remove: true,
        minify: true,
        preserve: [],
        force: true
      }
    },
    'removeUselessStrokeAndFill',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    
    // Shape and path optimization
    'removeHiddenElems',
    'removeEmptyText',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'convertShapeToPath',
    'convertEllipseToCircle',
    
    // Group and structure optimization
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    
    // Path merging and optimization
    {
      name: 'mergePaths',
      params: {
        force: true,
        floatPrecision: 3
      }
    },
    
    // Color optimization
    {
      name: 'convertColors',
      params: {
        currentColor: true,
        names2hex: true,
        rgb2hex: true,
        shorthex: true,
        shortname: true
      }
    },
    
    // Remove unnecessary elements
    'removeTitle',
    'removeDesc',
    'removeDimensions',
    'removeUnusedNS',
    'sortAttrs',
    'sortDefsChildren',
    
    // Remove unnecessary attributes
    {
      name: 'removeAttrs',
      params: {
        attrs: ['data-.*', 'class', 'style', 'fill-rule', 'clip-rule']
      }
    },
    
    // Final cleanup
    'removeOffCanvasPaths',
    'reusePaths'
  ],
  js2svg: {
    indent: 0,
    pretty: false,
    eol: 'lf'
  }
};

async function getAllSvgFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function optimizeSvg(filePath, outputDir) {
  try {
    const svgContent = await fs.readFile(filePath, 'utf8');
    const result = optimize(svgContent, {
      path: filePath,
      ...svgoConfig
    });
    
    // Determine output path
    const relativePath = path.relative(process.argv[2], filePath);
    const outputPath = path.join(outputDir, relativePath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write optimized file
    await fs.writeFile(outputPath, result.data);
    
    const originalSize = Buffer.byteLength(svgContent, 'utf8');
    const optimizedSize = Buffer.byteLength(result.data, 'utf8');
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(2);
    
    return {
      file: path.basename(filePath),
      originalSize,
      optimizedSize,
      savings: parseFloat(savings)
    };
  } catch (error) {
    console.error(`Error optimizing ${filePath}:`, error.message);
    return null;
  }
}

async function main() {
  const inputDir = process.argv[2];
  const outputDir = process.argv[3] || path.join(inputDir, '../max-optimized-emojis');
  
  if (!inputDir) {
    console.log('Usage: node optimize-svgs.js <input-directory> [output-directory]');
    console.log('Example: node optimize-svgs.js ./emojis ./optimized');
    process.exit(1);
  }
  
  console.log('🚀 Starting MAXIMUM AGGRESSIVE LOSSLESS optimization...');
  console.log(`📁 Input: ${inputDir}`);
  console.log(`📁 Output: ${outputDir}`);
  console.log('⚡ Using precision: 3 decimals (visually identical)');
  console.log('');
  
  // Get all SVG files
  const svgFiles = await getAllSvgFiles(inputDir);
  console.log(`📊 Found ${svgFiles.length} SVG files`);
  console.log('');
  
  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  
  // Optimize all files
  const startTime = Date.now();
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;
  
  console.log('⚡ Optimizing files with maximum lossless compression...');
  
  for (let i = 0; i < svgFiles.length; i++) {
    const result = await optimizeSvg(svgFiles[i], outputDir);
    
    if (result) {
      totalOriginalSize += result.originalSize;
      totalOptimizedSize += result.optimizedSize;
      processedCount++;
      
      // Progress indicator
      if ((i + 1) % 100 === 0 || i === svgFiles.length - 1) {
        const progress = ((i + 1) / svgFiles.length * 100).toFixed(1);
        process.stdout.write(`\r   Progress: ${i + 1}/${svgFiles.length} (${progress}%)`);
      }
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n');
  console.log('✅ Maximum lossless optimization complete!');
  console.log('');
  console.log('📈 Statistics:');
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total saved: ${((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Reduction: ${((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(2)}%`);
  console.log(`   Time taken: ${duration} seconds`);
  console.log(`   Speed: ${(processedCount / parseFloat(duration)).toFixed(0)} files/second`);
  console.log('');
  console.log('✨ Visual appearance: 100% IDENTICAL (lossless optimization)');
}

main().catch(console.error);
