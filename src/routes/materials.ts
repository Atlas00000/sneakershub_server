import { Router } from 'express';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const router = Router();

const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'threejs-assets';
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || 'https://421f31ce5d60990daad73b9c9448d1c8.r2.cloudflarestorage.com';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-42d9986d97a0490598cb89136641b713.r2.dev';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Parse texture files to identify material sets
 * Looks for patterns like:
 * - material_name_Color.jpg (albedo)
 * - material_name_NormalGL.jpg or material_name_NormalDX.jpg (normal)
 * - material_name_Roughness.jpg (roughness)
 * - material_name_Metallic.jpg (metallic, optional)
 */
function parseMaterialFiles(files: string[]): Array<{
  name: string;
  id: string;
  category: string;
  albedo?: string;
  normal?: string;
  roughness?: string;
  metallic?: string;
}> {
  const materialMap = new Map<string, {
    name: string;
    id: string;
    category: string;
    albedo?: string;
    normal?: string;
    roughness?: string;
    metallic?: string;
  }>();

  for (const file of files) {
    // Extract just the filename (handle nested paths)
    const pathParts = file.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // Skip if not a texture file
    if (!fileName.match(/\.(jpg|jpeg|png)$/i)) continue;

    // Extract material name and type
    // Patterns: MaterialName_Color.jpg, MaterialName_NormalGL.jpg, MaterialName_1K-JPG_Color.jpg, etc.
    // Also handle patterns like: Leather027_1K-JPG_Color.jpg
    const match = fileName.match(/^(.+?)_(Color|NormalGL|NormalDX|Roughness|Metallic|Displacement)\.(jpg|jpeg|png)$/i);
    
    if (!match) continue;

    const [, materialName, textureType, ext] = match;
    
    // Clean material name (remove resolution suffixes like _1K, _2K, etc.)
    const cleanName = materialName.replace(/_[0-9]+[kK]$/i, '').trim();
    const materialId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Determine category from material name
    let category = 'fabric';
    const nameLower = cleanName.toLowerCase();
    if (nameLower.includes('leather')) category = 'leather';
    else if (nameLower.includes('rubber')) category = 'rubber';
    else if (nameLower.includes('denim')) category = 'fabric';
    else if (nameLower.includes('cotton') || nameLower.includes('fabric')) category = 'fabric';
    else if (nameLower.includes('wool')) category = 'fabric';
    else if (nameLower.includes('metal')) category = 'metal';
    else if (nameLower.includes('premium') || nameLower.includes('alligator') || nameLower.includes('snake')) category = 'premium';

    // Get or create material entry
    if (!materialMap.has(materialId)) {
      materialMap.set(materialId, {
        name: cleanName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        id: materialId,
        category,
      });
    }

    const material = materialMap.get(materialId)!;
    const fullUrl = `${R2_PUBLIC_URL}/${file}`;

    // Map texture types
    const textureTypeLower = textureType.toLowerCase();
    if (textureTypeLower === 'color') {
      material.albedo = fullUrl;
    } else if (textureTypeLower === 'normalgl' || textureTypeLower === 'normaldx') {
      material.normal = fullUrl;
    } else if (textureTypeLower === 'roughness') {
      material.roughness = fullUrl;
    } else if (textureTypeLower === 'metallic') {
      material.metallic = fullUrl;
    }
  }

  return Array.from(materialMap.values());
}

/**
 * GET /api/materials/debug
 * Debug endpoint to list all files in R2 (for troubleshooting)
 */
router.get('/debug', async (req, res) => {
  try {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({ 
        error: 'R2 credentials not configured',
        hasAccessKey: !!R2_ACCESS_KEY_ID,
        hasSecretKey: !!R2_SECRET_ACCESS_KEY,
      });
    }

    // Try listing without prefix first
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 20, // Limit for debugging
    });

    const response = await s3Client.send(command);
    
    res.json({
      success: true,
      bucket: R2_BUCKET_NAME,
      endpoint: R2_ENDPOINT,
      filesFound: response.Contents?.length || 0,
      files: response.Contents?.map(obj => obj.Key).filter(Boolean) || [],
      prefix: 'threejs-assets/textures/',
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    });
  }
});

/**
 * GET /api/materials/list
 * Lists all materials from R2 and generates material definitions
 */
router.get('/list', async (req, res) => {
  try {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({ 
        error: 'R2 credentials not configured' 
      });
    }

    // Search for texture files in multiple possible locations
    const prefixes = [
      'threejs-assets/textures/',
      'textures/',
      '', // Root level (will filter for texture files)
    ];
    
    const files: string[] = [];
    
    // Try each prefix
    for (const prefix of prefixes) {
      let continuationToken: string | undefined;
      
      do {
        const command = new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const response = await s3Client.send(command);
        
        if (response.Contents) {
          // Filter for texture files (jpg, png) and exclude .glb, .hdr, .zip, etc.
          const textureFiles = response.Contents
            .map(obj => obj.Key!)
            .filter(key => key && /\.(jpg|jpeg|png)$/i.test(key) && !key.includes('.glb') && !key.includes('.hdr') && !key.includes('.zip'))
            .filter(Boolean);
          
          files.push(...textureFiles);
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);
    }
    
    // Remove duplicates
    const uniqueFiles = Array.from(new Set(files));

    // Parse files into material definitions
    const materials = parseMaterialFiles(uniqueFiles);

    res.json({
      success: true,
      count: materials.length,
      materials,
      files: uniqueFiles.length,
      sampleFiles: uniqueFiles.slice(0, 10), // Show first 10 for debugging
    });
  } catch (error) {
    console.error('Error listing materials:', error);
    res.status(500).json({ 
      error: 'Failed to list materials',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/materials/generate
 * Generates materials.json format from R2 files
 */
router.get('/generate', async (req, res) => {
  try {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({ 
        error: 'R2 credentials not configured' 
      });
    }

    // Search for texture files in multiple possible locations
    const prefixes = [
      'threejs-assets/textures/',
      'textures/',
      '', // Root level (will filter for texture files)
    ];
    
    const files: string[] = [];
    
    // Try each prefix
    for (const prefix of prefixes) {
      let continuationToken: string | undefined;
      
      do {
        const command = new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const response = await s3Client.send(command);
        
        if (response.Contents) {
          // Filter for texture files (jpg, png) and exclude .glb, .hdr, .zip, etc.
          const textureFiles = response.Contents
            .map(obj => obj.Key!)
            .filter(key => key && /\.(jpg|jpeg|png)$/i.test(key) && !key.includes('.glb') && !key.includes('.hdr') && !key.includes('.zip'))
            .filter(Boolean);
          
          files.push(...textureFiles);
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);
    }
    
    // Remove duplicates
    const uniqueFiles = Array.from(new Set(files));

    // Parse and generate material definitions
    const parsedMaterials = parseMaterialFiles(uniqueFiles);
    
    const materialDefinitions = parsedMaterials.map(material => ({
      id: material.id,
      name: material.name,
      category: material.category,
      description: `${material.name} material with realistic textures`,
      properties: {
        // When texture maps are present, use white color so textures show properly
        // (color acts as a multiplier/tint in Three.js)
        color: material.albedo ? '#ffffff' : '#3a3a3a',
        ...(material.albedo && { map: material.albedo }),
        ...(material.normal && { normalMap: material.normal }),
        ...(material.roughness && { roughnessMap: material.roughness }),
        ...(material.metallic && { metalnessMap: material.metallic }),
        roughness: material.category === 'rubber' ? 0.9 : material.category === 'leather' ? 0.4 : 0.7,
        metalness: 0.0,
      },
      priceModifier: material.category === 'premium' ? 50 : 0,
      premium: material.category === 'premium',
    }));

    res.json({
      success: true,
      materials: materialDefinitions,
      count: materialDefinitions.length,
    });
  } catch (error) {
    console.error('Error generating materials:', error);
    res.status(500).json({ 
      error: 'Failed to generate materials',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

