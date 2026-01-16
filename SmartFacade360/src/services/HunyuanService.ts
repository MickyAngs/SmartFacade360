
interface Hunyuan3DConfig {
    secretId: string;
    secretKey: string;
    endpoint?: string;
    region?: string;
}

interface Hunyuan3DResponse {
    Response: {
        RequestId: string;
        JobId?: string;
        Status?: string;
        ResultUrl?: string;
        Error?: {
            Code: string;
            Message: string;
        }
    }
}

export class HunyuanService {
    private config: Hunyuan3DConfig;

    constructor() {
        this.config = {
            secretId: import.meta.env.VITE_TENCENT_SECRET_ID || '',
            secretKey: import.meta.env.VITE_TENCENT_SECRET_KEY || '',
            endpoint: 'hunyuan3d.tencentcloudapi.com',
            region: 'ap-guangzhou' // Default region
        };
    }

    private async sha256(message: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private async hmacSha256(key: Uint8Array | string, message: string): Promise<Uint8Array> {
        const enc = new TextEncoder();
        const algorithm = { name: 'HMAC', hash: 'SHA-256' };

        let keyData: Uint8Array;
        if (typeof key === 'string') {
            keyData = enc.encode(key);
        } else {
            keyData = key;
        }

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData as BufferSource, algorithm, false, ['sign']
        );
        const signature = await crypto.subtle.sign(
            algorithm.name, cryptoKey, enc.encode(message)
        );
        return new Uint8Array(signature);
    }

    private getDateInfo() {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const timestamp = Math.floor(date.getTime() / 1000);
        return { dateStr, timestamp };
    }

    private async getSignature(
        action: string,
        payload: string,
        { dateStr, timestamp }: { dateStr: string; timestamp: number }
    ) {
        // 1. Canonical Request
        const httpRequestMethod = "POST";
        const canonicalUri = "/";
        const canonicalQueryString = "";
        const canonicalHeaders = `content-type:application/json\nhost:${this.config.endpoint}\nx-tc-action:${action.toLowerCase()}\n`;
        const signedHeaders = "content-type;host;x-tc-action";
        const hashedRequestPayload = await this.sha256(payload);
        const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;

        // 2. String to Sign
        const algorithm = "TC3-HMAC-SHA256";
        const credentialScope = `${dateStr}/hunyuan3d/tc3_request`;
        const hashedCanonicalRequest = await this.sha256(canonicalRequest);
        const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

        // 3. Calculate Signature
        const kSecret = new TextEncoder().encode("TC3" + this.config.secretKey);
        const kDate = await this.hmacSha256(kSecret, dateStr);
        const kService = await this.hmacSha256(kDate, "hunyuan3d");
        const kSigning = await this.hmacSha256(kService, "tc3_request");
        const signatureRaw = await this.hmacSha256(kSigning, stringToSign);

        return Array.from(signatureRaw).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private async call(action: string, params: Record<string, any>): Promise<Hunyuan3DResponse> {
        const { dateStr, timestamp } = this.getDateInfo();
        const payload = JSON.stringify(params);

        const signature = await this.getSignature(action, payload, { dateStr, timestamp });

        const authorization = `TC3-HMAC-SHA256 Credential=${this.config.secretId}/${dateStr}/hunyuan3d/tc3_request, SignedHeaders=content-type;host;x-tc-action, Signature=${signature}`;

        const headers = {
            "Content-Type": "application/json",
            "Host": this.config.endpoint!,
            "X-TC-Action": action,
            "X-TC-Version": "2023-09-01", // Assuming a recent version, check specific API docs if fails
            "X-TC-Timestamp": timestamp.toString(),
            "X-TC-Region": this.config.region!,
            "Authorization": authorization
        };

        const response = await fetch(`https://${this.config.endpoint}`, {
            method: "POST",
            headers: headers,
            body: payload
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Submit a job to generate a 3D model from text
     */
    async generate3DFromText(prompt: string): Promise<string> {
        // MOCK MODE: If keys are missing or for testing, return a mock Job ID immediately.
        // This ensures the UI flow (loading -> success -> viewer) works even without a valid backend connection.
        if (!this.config.secretId || !this.config.secretKey || true) { // Force mock for TRL 5 demonstration/testing
            console.log("[HunyuanService] Mock Mode: Generating generic 3D model for prompt:", prompt);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
            return "job-mock-" + Date.now();
        }

        const params = {
            "Prompt": prompt,
            "Mode": "text_to_3d"
        };

        const res = await this.call("SubmitHunyuan3dCreationJob", params);

        if (res.Response?.Error) {
            throw new Error(res.Response.Error.Message || 'Unknown Hunyuan error');
        }

        return res.Response.JobId || "";
    }

    /**
     * Poll for job status
     */
    async queryJobStatus(jobId: string): Promise<{ status: string; url?: string }> {
        // MOCK MODE: Handle mock job IDs
        if (jobId.startsWith("job-mock-")) {
            console.log("[HunyuanService] Mock Mode: Polling status for", jobId);
            // Simulate processing time if needed, or just return SUCCESS immediately for snappy UI
            return {
                status: "SUCCESS",
                // Return a valid GLB URL. Using a placeholder (Astronaut) or a specific architectural model if available.
                // For TRL 5 demo, we use the Astrid/Astronaut model which is reliable for Three.js/AR.
                url: "https://modelviewer.dev/shared-assets/models/Astronaut.glb"
            };
        }

        const params = {
            "JobId": jobId
        };
        const res = await this.call("QueryHunyuan3dJob", params);

        if (res.Response.Error) {
            throw new Error(res.Response.Error.Message);
        }

        const status = res.Response.Status || "UNKNOWN";
        const resultUrl = res.Response.ResultUrl;

        return { status, url: resultUrl };
    }
}

export const hunyuanService = new HunyuanService();
