const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const config = require('../../config/config');

const awsS3 = () => {
    const s3 = new S3Client({
        endpoint: 'https://' + config.do.endpoint,
        forcePathStyle: false,
        region: 'us-east-1',
        credentials: {
            accessKeyId: config.do.access_key,
            secretAccessKey: config.do.secret_access_key
        }
    });
    return s3;
};

module.exports = async function uploadDo(buffer, mimeType) {
    try {
        const s3 = awsS3();

        let extension = mime.extension(mimeType);
        extension = extension ? '.' + extension : '';

        const params = {
            Bucket: config.do.bucket,
            Key: `${config.do.folder}${uuidv4()}${extension}`,
            Body: buffer,
            ContentType: mimeType,
            ACL: 'public-read'
        };

        const data = await s3.send(new PutObjectCommand(params));

        if (!data) return '';

        const url = `https://${params.Bucket}.${config.do.endpoint}/${params.Key}`;

        return url;
    } catch (error) {
        return '';
    }
};
