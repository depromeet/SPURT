import type { AppleAuthorizationResponse } from "@/types/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const body: AppleAuthorizationResponse = await req.json();
		const {
			authorization: { code, id_token },
			user,
		} = body;

		if (!code || !id_token) {
			return NextResponse.json(
				{ error: "Authorization code or id-token is missing" },
				{ status: 400 },
			);
		}

		const oauthResponse = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login/apple`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					authCode: code,
					nickname: user?.name
						? `${user.name.lastName}${user.name.firstName}`
						: null,
					email: user?.email ? user.email : null,
				}),
			},
		);

		if (!oauthResponse.ok) {
			const errorData = await oauthResponse.json();
			return NextResponse.json(
				{ error: "Failed to authenticate", details: errorData },
				{ status: oauthResponse.status },
			);
		}

		const data = await oauthResponse.json();
		const accessToken = data.jwtTokenDto.accessToken;
		const refreshToken = data.jwtTokenDto.refreshToken;
		const userData = data.memberInfo;
		const isNewUser = data.isNewUser;

		if (!accessToken || !refreshToken) {
			return NextResponse.json(
				{ error: "Tokens not found in the response" },
				{ status: 500 },
			);
		}

		const nextResponse = NextResponse.json({
			success: true,
			userData: userData,
			isNewUser: isNewUser,
		});

		nextResponse.cookies.set("accessToken", accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60,
		});

		nextResponse.cookies.set("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 30,
		});

		nextResponse.cookies.set("userData", JSON.stringify(userData), {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 31536000,
		});

		return nextResponse;
	} catch (error) {
		console.error("Error in POST /auth:", error);
		return NextResponse.json({ error: error }, { status: 500 });
	}
}
