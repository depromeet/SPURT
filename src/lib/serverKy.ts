import { batchRequestsOf } from "@toss/utils"; // ①
import ky from "ky";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const REFRESH_ENDPOINT = "/v1/auth/token/refresh";
const UNAUTHORIZED_CODE = 401;

export async function refreshTokenOnce(): Promise<string> {
	const cookieStore = await cookies();
	const oldRefreshToken = cookieStore.get("refreshToken")?.value;

	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}${REFRESH_ENDPOINT}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken: oldRefreshToken }),
		},
	);

	if (!res.ok) {
		const errText = await res.text();
		console.error("Refresh API 실패:", errText);
		cookieStore.delete("accessToken");
		cookieStore.delete("refreshToken");
		throw new Error("refresh failed");
	}

	const { accessToken, refreshToken: newRefreshToken } = (await res.json()) as {
		accessToken: string;
		refreshToken: string;
	};

	cookieStore.set("accessToken", accessToken, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60,
	});
	cookieStore.set("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30,
	});

	return accessToken;
}

const batchedRefresh = batchRequestsOf(refreshTokenOnce);

export const serverApi = ky.create({
	prefixUrl: process.env.NEXT_PUBLIC_API_URL,
	credentials: "include",
	headers: { "Content-Type": "application/json" },
	retry: {
		limit: 2,
		methods: ["get", "post"],
		statusCodes: [408, 413, 429, 500, 502, 503, 504],
	},
	hooks: {
		beforeRequest: [
			async (request) => {
				const cookieStore = await cookies();
				const token = cookieStore.get("accessToken")?.value;
				if (token) {
					request.headers.set("Authorization", `Bearer ${token}`);
				}
			},
		],
		afterResponse: [
			async (request, options, response) => {
				if (response.status === UNAUTHORIZED_CODE) {
					try {
						const newToken = await batchedRefresh();
						request.headers.set("Authorization", `Bearer ${newToken}`);
						return serverApi(request, options);
					} catch {
						return NextResponse.redirect(new URL("/login", request.url));
					}
				}
				return response;
			},
		],
	},
});
