import connectDB from "@/lib/db";
import userModel from "@/models/user.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        await connectDB()
        const { name, email, password } = await request.json()
        const existUser = await userModel.findOne({ email })
        if (existUser) {
            return NextResponse.json(
                { message: "Email already exists!" },
                { status: 400 }
            )
        }
        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password should contain at least 6 characters." },
                { status: 400 }
            )
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await userModel.create({
            name, email, password: hashedPassword
        })
        return NextResponse.json(
            user,
            { status: 201 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `Register error ${error}` },
            { status: 500 }
        )
    }
}