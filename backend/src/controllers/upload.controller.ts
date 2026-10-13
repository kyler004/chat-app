import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

// Note: Cloudinary will need to be configured somewhere, e.g. in index.ts or a config file
// but we will do it inline or depend on env vars for simplicity.

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadMedia = async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto',
            folder: 'relay_uploads',
        });

        res.status(200).json({
            url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id,
            format: uploadResponse.format,
            bytes: uploadResponse.bytes,
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Error uploading file' });
    }
};
