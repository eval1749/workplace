// Copyright (c) 2014 Project Vogue. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#if !defined(INCLUDE_base_basictypes_h)
#define INCLUDE_base_basictypes_h

// Put this in the private: declarations for a class to be uncopyable.
#define DISALLOW_COPY(TypeName) \
  public: TypeName(const TypeName&) = delete

// Put this in the private: declarations for a class to be unassignable.
#define DISALLOW_ASSIGN(TypeName) \
  public: void operator=(const TypeName&) = delete

// A macro to disallow the copy constructor and operator= functions
// This should be used in the private: declarations for a class
#define DISALLOW_COPY_AND_ASSIGN(TypeName) \
  public: TypeName(const TypeName&) = delete; \
  public: void operator=(const TypeName&) = delete

#ifndef HINST_THISCOMPONENT
EXTERN_C IMAGE_DOS_HEADER __ImageBase;
#define HINST_THISCOMPONENT ((HINSTANCE)&__ImageBase)
#endif

#define DVLOG(m) std::cerr
#define NOTREACHED() __debugbreak()

#define COM_VERIFY(expr) { \
  auto const macro_hr = (expr); \
  if (FAILED(macro_hr)) { \
    DVLOG(ERROR) << "hr=" << std::hex << macro_hr << " " <<  #expr; \
    NOTREACHED(); \
  } \
}

#define WIN32_VERIFY(expr) { \
  if (!(expr)) { \
    auto const last_error = ::GetLastError(); \
    DVLOG(ERROR) << "Faild: " << #expr << " err=" << last_error; \
  } \
}

#define DCHECK(expr) (Check(__FILE__, __LINE__, #expr, (expr)))

#define DCHECK_EQ(expr1, expr2) { \
  Check(__FILE__, __LINE__, #expr1 "==" #expr2, (expr1) == (expr2)); \
}

std::ostream& Check(const char* file_name, int line_number,
                    const char* expr_string, bool expr_value) {
  if (expr_value) {
    static std::stringstream null_stream;
    return null_stream;
  }
  std::cerr << "Assetion failed: " << expr_string << std::endl <<
      "File: " << file_name << std::endl <<
      "Line: " << line_number;
  NOTREACHED();
  return std::cerr;
}

namespace base {
typedef wchar_t char16;
typedef std::wstring string16;
typedef std::char_traits<wchar_t> string16_char_traits;
}  // base

//////////////////////////////////////////////////////////////////////
//
// LARGE_INTEGER
//
LARGE_INTEGER operator+(const LARGE_INTEGER& large1,
                        const LARGE_INTEGER& large2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart - large2.QuadPart;
  return result;
}

LARGE_INTEGER operator-(const LARGE_INTEGER& large1,
                        const LARGE_INTEGER& large2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart - large2.QuadPart;
  return result;
}

LARGE_INTEGER operator*(const LARGE_INTEGER& large1,
                        const LARGE_INTEGER& large2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart * large2.QuadPart;
  return result;
}

LARGE_INTEGER operator*(const LARGE_INTEGER& large1, int int2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart * int2;
  return result;
}

LARGE_INTEGER operator/(const LARGE_INTEGER& large1,
                        const LARGE_INTEGER& large2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart / large2.QuadPart;
  return result;
}

#endif //!defined(INCLUDE_base_basictypes_h)
