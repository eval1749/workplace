// C4530 L1: C++ exception handler used, but unwind semantics are not enabled.
// Specify /EHsc
#pragma warning(disable: 4530)

#define UNICODE
#define WIN32_LEAN_AND_MEAN
#define WINVER 0x0700
#define _WIN32_WINNT 0x0700
#include <windows.h>
#undef max
#undef min
#include <dcomp.h>
#include <d3d11.h>
#include <d2d1.h>
#include <d2d1helper.h>
#include <dwmapi.h>
#include <dwrite.h>
#include <dxgi1_3.h>
#include <dxgidebug.h>

#include <algorithm>
#include <iostream>
#include <limits>
#include <list>
#include <memory>
#include <string>
#include <sstream>
#include <unordered_set>

#pragma comment(lib, "d2d1.lib")
#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dcomp.lib")
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "dwrite.lib")
#pragma comment(lib, "dxguid.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "user32.lib")

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

//////////////////////////////////////////////////////////////////////
//
// ComPtr
//
template<class T> class ComPtr {
  private: T* ptr_;
  public: explicit ComPtr(T* ptr = nullptr) : ptr_(ptr) {
    if (ptr_)
      ptr_->AddRef();
  }
  public: explicit ComPtr(T& ptr) : ptr_(&ptr) {}
  public: ComPtr(const ComPtr& other) : ptr_(other.ptr_) {
    if (ptr_)
      ptr_->AddRef();
  }
  public: ComPtr(ComPtr&& other) : ptr_(other.ptr_) {
    other.ptr_ = nullptr;
  }
  public: ~ComPtr() {
    reset();
  }
  public: operator T*() const { return ptr_; }
  public: explicit operator bool() const { return ptr_; }
  public: T* operator->() const { return ptr_; }
  public: T** operator&() {
    DCHECK(!ptr_) << "Leak COM interface";
    return &ptr_;
  }
  public: bool operator!() const { return !ptr_; }

  public: bool operator==(const ComPtr& other) const {
    return ptr_ == other.ptr_;
  }

  public: bool operator==(T* other) const {
    return ptr_ == other;
  }

  public: bool operator!=(const ComPtr& other) const {
    return ptr_ != other.ptr_;
  }

  public: bool operator!=(T* other) const {
    return ptr_ != other;
  }

  public: ComPtr& operator=(const ComPtr& other) {
    ptr_ = other.ptr_;
    if (ptr_)
      ptr_->AddRef();
  }

  public: ComPtr& operator=(ComPtr&& other) {
    ptr_ = other.ptr_;
    other.ptr_ = nullptr;
    return *this;
  }

  public: ComPtr& operator=(T* ptr) = delete;

  public: T* get() const { return ptr_; }

  public: void** location() {
    DCHECK(!ptr_) << "Leak COM interface";
    return reinterpret_cast<void**>(&ptr_);
  }

  public: IUnknown** locationUnknown() {
    DCHECK(!ptr_) << "Leak COM interface";
    return reinterpret_cast<IUnknown**>(&ptr_);
  }

  public: T* release() {
    DCHECK(ptr_) << "Give ownership for uninitialized object";
    auto const ret = ptr_;
    ptr_ = nullptr;
    return ret;
  }

  public: void reset(T* ptr) {
    if (ptr_)
      ptr_->Release();
    ptr_ = ptr;
    if (ptr_)
      ptr_->AddRef();
  }

  public: void reset() {
    if (ptr_)
      ptr_->Release();
    ptr_ = nullptr;
  }

  public: void MustBeNoOtherUse() {
    auto const ref_count = ptr_->AddRef();
    ptr_->Release();
    DCHECK_EQ(ref_count, 2);
  }

  public: HRESULT QueryFrom(IUnknown* other) {
    return other->QueryInterface(__uuidof(T), location());
  }
};

class ComInitializer {
  public: ComInitializer() {
    COM_VERIFY(::CoInitialize(nullptr));
  }
  public: ~ComInitializer() {
    ::CoUninitialize();
  }
};

class SingletonBase {
  protected: SingletonBase() = default;
  public: virtual ~SingletonBase() = default;

  DISALLOW_COPY_AND_ASSIGN(SingletonBase);
};

std::vector<SingletonBase*>* all_singletons;

template<class T>
class Singleton : public SingletonBase {
  protected: Singleton() = default;
  protected: ~Singleton() = default;

  public: static T* instance() {
    static T* instance;
    if (!instance) {
      instance = new T();
      all_singletons->push_back(instance);
    }
    return instance;
  }

  DISALLOW_COPY_AND_ASSIGN(Singleton);
};

#define DECLARE_SINGLETON_CLASS(name) \
  friend class Singleton<name>

namespace gfx {

using D2D1::ColorF;

//////////////////////////////////////////////////////////////////////
//
// SizeF
//
class SizeF final {
  private: D2D1_SIZE_F size_;

  public: SizeF(const SizeF& other);
  public: SizeF(const D2D1_SIZE_F& size);
  public: SizeF(float x, float y);
  public: SizeF();

  public: operator const D2D1_SIZE_F&() const { return size_; }
  public: operator D2D1_SIZE_F() { return size_; }

  public: SizeF operator+(const SizeF& other) const;
  public: SizeF operator+(float value) const;
  public: SizeF operator-(const SizeF& other) const;
  public: SizeF operator-(float value) const;

  public: SizeF& operator=(float new_value);
  public: SizeF& operator+=(const SizeF& other);
  public: SizeF& operator+=(float new_value);
  public: SizeF& operator-=(const SizeF& other);
  public: SizeF& operator-=(float new_value);

  public: bool operator==(const SizeF& other) const;
  public: bool operator!=(const SizeF& other) const;

  public: float height() const { return size_.height; }
  public: void set_height(float new_height) { size_.height = new_height; }
  public: float width() const { return size_.width; }
  public: void set_width(float new_width) { size_.width = new_width; }
};

SizeF::SizeF(const SizeF& other) : size_(other.size_) {
}

SizeF::SizeF(const D2D1_SIZE_F& size) : size_(size) {
}

SizeF::SizeF(float width, float height) {
  size_.width = width;
  size_.height = height;
}

SizeF::SizeF() : SizeF(0.0f, 0.0f) {
}

SizeF SizeF::operator+(const SizeF& other) const {
  return SizeF(width() + other.width(), height() + other.height());
}

SizeF SizeF::operator+(float value) const {
  return SizeF(width() + value, height() + value);
}

SizeF SizeF::operator-(const SizeF& other) const {
  return SizeF(width() - other.width(), height() - other.height());
}

SizeF SizeF::operator-(float value) const {
  return SizeF(width() - value, height() - value);
}

SizeF& SizeF::operator=(float new_value) {
  size_.width = size_.height = new_value;
  return *this;
}

SizeF& SizeF::operator+=(const SizeF& other) {
  size_.width += other.size_.width;
  size_.height += other.size_.height;
  return *this;
}

SizeF& SizeF::operator+=(float new_value) {
  size_.width += new_value;
  size_.height += new_value;
  return *this;
}

SizeF& SizeF::operator-=(const SizeF& other) {
  size_.width += other.size_.width;
  size_.height += other.size_.height;
  return *this;
}

SizeF& SizeF::operator-=(float new_value) {
  size_.width -= new_value;
  size_.height -= new_value;
  return *this;
}

bool SizeF::operator==(const SizeF& other) const {
  return size_.width == other.size_.width && size_.height == other.size_.height;
}

bool SizeF::operator!=(const SizeF& other) const {
  return !operator==(other);
}

//////////////////////////////////////////////////////////////////////
//
// PointF
//
class PointF final {
  private: D2D1_POINT_2F point_;

  public: PointF(const PointF& other);
  public: PointF(const D2D1_POINT_2F& point);
  public: PointF(float x, float y);
  public: PointF();

  public: operator const D2D1_POINT_2F&() const { return point_; }
  public: operator D2D1_POINT_2F&() { return point_; }

  public: PointF operator+(const SizeF& size) const;
  public: PointF operator-(const SizeF& size) const;

  public: PointF& operator=(float new_value);
  public: PointF& operator+=(const SizeF& other);
  public: PointF& operator+=(float new_value);
  public: PointF& operator-=(const SizeF& other);
  public: PointF& operator-=(float new_value);

  public: bool operator==(const PointF& other) const;
  public: bool operator!=(const PointF& other) const;

  public: float x() const { return point_.x; }
  public: void set_x(float new_x) { point_.x = new_x; }
  public: float y() const { return point_.y; }
  public: void set_y(float new_y) { point_.y = new_y; }

  public: float Distance(const PointF& other) const;
};

PointF::PointF(const PointF& other) : point_(other.point_) {
}

PointF::PointF(const D2D1_POINT_2F& point) : point_(point) {
}

PointF::PointF(float x, float y) {
  point_.x = x;
  point_.y = y;
}

PointF::PointF() : PointF(0.0f, 0.0f) {
}

PointF PointF::operator+(const SizeF& size) const {
  return PointF(x() + size.width(), y() + size.height());
}

PointF PointF::operator-(const SizeF& size) const {
  return PointF(x() - size.width(), y() - size.height());
}

PointF& PointF::operator=(float new_value) {
  point_.x = point_.y = new_value;
  return *this;
}

PointF& PointF::operator+=(const SizeF& size) {
  point_.x += size.width();
  point_.y += size.height();
  return *this;
}

PointF& PointF::operator+=(float new_value) {
  point_.x += new_value;
  point_.y += new_value;
  return *this;
}

PointF& PointF::operator-=(const SizeF& size) {
  point_.x -= size.width();
  point_.y -= size.height();
  return *this;
}

PointF& PointF::operator-=(float new_value) {
  point_.x -= new_value;
  point_.y -= new_value;
  return *this;
}

bool PointF::operator==(const PointF& other) const {
  return point_.x == other.point_.x && point_.y == other.point_.y;
}

bool PointF::operator!=(const PointF& other) const {
  return !operator==(other);
}

float PointF::Distance(const PointF& other) const {
  auto const dx = point_.x - other.point_.x;
  auto const dy = point_.y - other.point_.y;
  return ::sqrt(dx * dx + dy * dy);
}

//////////////////////////////////////////////////////////////////////
//
// RectF
//
class RectF final {
  private: D2D1_RECT_F rect_;

  public: RectF(const RectF& other);
  public: RectF(const D2D1_RECT_F& rect);
  public: RectF(float left, float top, float right, float bottom);
  public: RectF(const PointF& origin, const PointF& bottom_right);
  public: RectF(const PointF& origin, const SizeF& size);
  public: RectF();

  public: operator const D2D1_RECT_F&() const { return rect_; }
  public: operator D2D1_RECT_F&() { return rect_; }

  public: RectF operator+(const SizeF& size) const;
  public: RectF operator+(float value) const {
    return operator+(SizeF(value, value));
  }
  public: RectF operator-(const SizeF& size) const;
  public: RectF operator-(float value) const {
    return operator-(SizeF(value, value));
  }

  public: RectF& operator+=(const SizeF& size);
  public: RectF& operator+=(float new_value);
  public: RectF& operator-=(const SizeF& size);
  public: RectF& operator-=(float new_value);

  public: bool operator==(const RectF& other) const;
  public: bool operator!=(const RectF& other) const;

  public: float bottom() const { return rect_.bottom; }
  public: PointF bottom_right() const { return PointF(right(), bottom()); }
  public: float left() const { return rect_.left; }
  public: float height() const { return rect_.bottom - rect_.top; }
  public: PointF origin() const { return PointF(left(), top()); }
  public: void set_origin(const gfx::PointF& origin);
  public: float right() const { return rect_.right; }
  public: SizeF size() const { return SizeF(width(), height()); }
  public: void set_size(const gfx::SizeF& size);
  public: float top() const { return rect_.top; }
  public: float width() const { return rect_.right - rect_.left; }

  public: bool Contains(const PointF& point)const;

  // Move the rectangle by horizontal and vertical distance.
  public: RectF Offset(const SizeF& size) const;
};

RectF::RectF(const RectF& other) : rect_(other.rect_) {
}

RectF::RectF(const D2D1_RECT_F& rect) : rect_(rect) {
}

RectF::RectF(float left, float top, float right, float bottom) {
  rect_.left = left;
  rect_.top = top;
  rect_.right = right;
  rect_.bottom = bottom;
}

RectF::RectF(const PointF& origin, const PointF& bottom_right)
    : RectF(origin.x(), origin.y(), bottom_right.x(), bottom_right.y()) {
}

RectF::RectF(const PointF& origin, const SizeF& size)
    : RectF(origin, origin + size) {
}

RectF::RectF() : RectF(0.0f, 0.0f, 0.0f, 0.0f) {
}

RectF RectF::operator+(const SizeF& size) const {
  return gfx::RectF(left() - size.width(), top() - size.height(),
                    right() + size.width(), bottom() - size.height());
}

RectF RectF::operator-(const SizeF& size) const {
  return gfx::RectF(left() + size.width(), top() + size.height(),
                    right() - size.width(), bottom() - size.height());
}

RectF& RectF::operator+=(const SizeF& size) {
  rect_.left -= size.width();
  rect_.top -= size.height();
  rect_.right += size.width();
  rect_.bottom += size.height();
  return *this;
}

RectF& RectF::operator+=(float new_value) {
  return *this += SizeF(new_value, new_value);
}

RectF& RectF::operator-=(const SizeF& size) {
  rect_.left += size.width();
  rect_.top += size.height();
  rect_.right -= size.width();
  rect_.bottom -= size.height();
  return *this;
}

RectF& RectF::operator-=(float new_value) {
  return *this -= SizeF(new_value, new_value);
}

bool RectF::operator==(const RectF& other) const {
  return rect_.left == other.rect_.left && rect_.top == other.rect_.top &&
         rect_.right == other.rect_.right &&
         rect_.bottom == other.rect_.bottom;
}

bool RectF::operator!=(const RectF& other) const {
  return !operator==(other);
}

void RectF::set_origin(const PointF& new_origin){
  auto const size = this->size();
  rect_.left = new_origin.x();
  rect_.top = new_origin.y();
  rect_.right = rect_.left + size.width();
  rect_.bottom = rect_.top + size.height();
}

void RectF::set_size(const SizeF& new_size) {
  rect_.right = rect_.left + new_size.width();
  rect_.bottom = rect_.top + new_size.height();
}

bool RectF::Contains(const PointF& point) const {
  return point.x() >= rect_.left && point.x() < rect_.right &&
         point.y() >= rect_.top && point.y() < rect_.bottom;
}

RectF RectF::Offset(const SizeF& size) const {
  return gfx::RectF(origin() + size, this->size());
}

//////////////////////////////////////////////////////////////////////
//
// Factory
//
// This class is a singleton class provides:
//  - D2D1Factory
//  - D3D11 Device
//  - Composition Device
//
class Factory final : public Singleton<Factory> {
  DECLARE_SINGLETON_CLASS(Factory);

  private: D2D1_BITMAP_PROPERTIES1 bitmap_properties_;
  private: ComPtr<ID2D1Factory1> d2d_factory_;
  private: ComPtr<IDWriteFactory> dwrite_factory_;
  private: ComPtr<IDXGIDevice3> dxgi_device_;

  private: Factory();
  private: virtual ~Factory();

  public: ID2D1Factory1* d2d_factory() const { return d2d_factory_; }
  public: IDWriteFactory* dwrite() const { return dwrite_factory_; }
  public: IDXGIDevice3* dxgi_device() const { return dxgi_device_; }

  DISALLOW_COPY_AND_ASSIGN(Factory);
};

Factory::Factory() {
  // Create DWrite factory.
  COM_VERIFY(::DWriteCreateFactory(
      DWRITE_FACTORY_TYPE_SHARED,
      __uuidof(IDWriteFactory),
      dwrite_factory_.locationUnknown()));

  // Create Direct 2D factory.
  COM_VERIFY(::D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED,
                                 &d2d_factory_));

  // Create Direct 3D device.
  D3D_FEATURE_LEVEL feature_levels[] = {
      D3D_FEATURE_LEVEL_11_1,
      D3D_FEATURE_LEVEL_11_0,
  };

  auto const d3d11_flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT |
                           D3D11_CREATE_DEVICE_SINGLETHREADED |
                           D3D11_CREATE_DEVICE_DEBUG;

  ComPtr<ID3D11Device> d3d_device;
  COM_VERIFY(::D3D11CreateDevice(
      nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
      d3d11_flags, nullptr, 0, D3D11_SDK_VERSION,
      &d3d_device, feature_levels, nullptr));
  COM_VERIFY(dxgi_device_.QueryFrom(d3d_device));
}

Factory::~Factory(){
  {
    auto const event = ::CreateEvent(nullptr, false, false, nullptr);
    COM_VERIFY(dxgi_device_->EnqueueSetEvent(event));
    ::WaitForSingleObject(event, INFINITE);
    ::CloseHandle(event);
    dxgi_device_->Trim();
  }
  d2d_factory_.reset();
  dwrite_factory_.reset();
  dxgi_device_.reset();
}

//////////////////////////////////////////////////////////////////////
//
// SwapChain
//
class SwapChain {
  private: ComPtr<ID2D1DeviceContext> d2d_device_context_;
  private: bool is_ready_;
  private: ComPtr<IDXGISwapChain2> swap_chain_;
  private: HANDLE swap_chain_waitable_;

  public: SwapChain(IDXGIDevice* dxgi_device, const D2D1_SIZE_U& size);
  public: ~SwapChain();

  public: ID2D1DeviceContext* d2d_device_context() const {
    return d2d_device_context_;
  }
  public: IDXGISwapChain2* swap_chain() const { return swap_chain_; }

  public: void DidResize(const D2D1_SIZE_U& size);
  public: bool IsReady();
  public: void Present();
  private: void UpdateDeviceContext();

  DISALLOW_COPY_AND_ASSIGN(SwapChain);
};

SwapChain::SwapChain(IDXGIDevice* dxgi_device, const D2D1_SIZE_U& size)
    : is_ready_(false), swap_chain_waitable_(nullptr) {
  ComPtr<IDXGIAdapter> dxgi_adapter;
  dxgi_device->GetAdapter(&dxgi_adapter);

  ComPtr<IDXGIFactory2> dxgi_factory;
  dxgi_adapter->GetParent(IID_PPV_ARGS(&dxgi_factory));

  DXGI_SWAP_CHAIN_DESC1 swap_chain_desc = {0};
  swap_chain_desc.AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED;
  swap_chain_desc.Width = size.width;
  swap_chain_desc.Height = size.height;
  swap_chain_desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
  swap_chain_desc.SampleDesc.Count = 1; // don't use multi-sampling
  swap_chain_desc.SampleDesc.Quality = 0;
  swap_chain_desc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
  swap_chain_desc.BufferCount = 2;  // use double buffering to enable flip
  swap_chain_desc.Scaling = DXGI_SCALING_STRETCH;
  swap_chain_desc.SwapEffect = DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL;
  swap_chain_desc.Flags = DXGI_SWAP_CHAIN_FLAG_FRAME_LATENCY_WAITABLE_OBJECT;

  ComPtr<IDXGISwapChain1> swap_chain1;
  COM_VERIFY(dxgi_factory->CreateSwapChainForComposition(
      dxgi_device, &swap_chain_desc, nullptr,
      &swap_chain1));
  COM_VERIFY(swap_chain_.QueryFrom(swap_chain1));

  // TODO(yosi) We should know when we retrieve waitable object from swap
  // chain.
  if (swap_chain_waitable_)
    ::CloseHandle(swap_chain_waitable_);
  swap_chain_waitable_ = swap_chain_->GetFrameLatencyWaitableObject();

  // http://msdn.microsoft.com/en-us/library/windows/apps/dn448914.aspx
  // Swapchains created with the
  // DXGI_SWAP_CHAIN_FLAG_FRAME_LATENCY_WAITABLE_OBJECT flag use their own
  // per-swapchain latency setting instead of the one associated with the DXGI
  // device. The default per-swapchain latency is 1, which ensures that DXGI
  // does not queue more than one frame at a time. This both reduces latency
  // and ensures that the application will only render after each VSync,
  // minimizing power consumption.
  // COM_VERIFY(swap_chain_->SetMaximumFrameLatency(1));

  // Create d2d device context
  ComPtr<ID2D1Device> d2d_device;
  COM_VERIFY(gfx::Factory::instance()->d2d_factory()->CreateDevice(
      dxgi_device, &d2d_device));

  COM_VERIFY(d2d_device->CreateDeviceContext(
      D2D1_DEVICE_CONTEXT_OPTIONS_NONE, &d2d_device_context_));

  UpdateDeviceContext();
}

SwapChain::~SwapChain() {
  d2d_device_context_->SetTarget(nullptr);
  d2d_device_context_.MustBeNoOtherUse();
  d2d_device_context_.reset();
  swap_chain_.MustBeNoOtherUse();
}

void SwapChain::DidResize(const D2D1_SIZE_U& size) {
  d2d_device_context_->SetTarget(nullptr);
  COM_VERIFY(swap_chain_->ResizeBuffers(0u, size.width, size.height,
      DXGI_FORMAT_UNKNOWN,
      DXGI_SWAP_CHAIN_FLAG_FRAME_LATENCY_WAITABLE_OBJECT));
  UpdateDeviceContext();
}

bool SwapChain::IsReady() {
  if (is_ready_)
    return true;
  auto const wait = ::WaitForSingleObject(swap_chain_waitable_, 0);
  switch (wait){
    case WAIT_OBJECT_0:
      is_ready_ = true;
      return true;
    case WAIT_TIMEOUT:
      return false;
    default:
      NOTREACHED();
  }
  return false;
}

void SwapChain::Present() {
  DXGI_PRESENT_PARAMETERS present_params = {0};
  auto const flags = DXGI_PRESENT_DO_NOT_WAIT;
  COM_VERIFY(swap_chain_->Present1(0, flags, &present_params));
  is_ready_ = false;
}

void SwapChain::UpdateDeviceContext() {
  // Allocate back buffer for d2d device context.
  {
    ComPtr<IDXGISurface> dxgi_back_buffer;
    swap_chain_->GetBuffer(0, IID_PPV_ARGS(&dxgi_back_buffer));

    float dpi_x, dpi_y;
    gfx::Factory::instance()->d2d_factory()->GetDesktopDpi(&dpi_x, &dpi_y);
    auto const bitmap_properties = D2D1::BitmapProperties1(
        D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW,
        D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM,
                          D2D1_ALPHA_MODE_PREMULTIPLIED),
        dpi_x, dpi_y);

    ComPtr<ID2D1Bitmap1> d2d_back_buffer;
    COM_VERIFY(d2d_device_context_->CreateBitmapFromDxgiSurface(
        dxgi_back_buffer, bitmap_properties, &d2d_back_buffer));
    d2d_device_context_->SetTarget(d2d_back_buffer);
  }

  d2d_device_context_->SetTextAntialiasMode(D2D1_TEXT_ANTIALIAS_MODE_CLEARTYPE);
}

//////////////////////////////////////////////////////////////////////
//
// Bitmap
//
class Bitmap final {
  private: ComPtr<ID2D1Bitmap1> bitmap_;

  public: Bitmap(ID2D1DeviceContext* canvas, const D2D1_SIZE_U& size);
  public: ~Bitmap() = default;

  public: operator ID2D1Bitmap1*() const { return bitmap_; }

  DISALLOW_COPY_AND_ASSIGN(Bitmap);
};

Bitmap::Bitmap(ID2D1DeviceContext* canvas, const D2D1_SIZE_U& size) {
  float dpi_x, dpi_y;
  canvas->GetDpi(&dpi_x, &dpi_y);
  auto const properties = D2D1::BitmapProperties1(
      D2D1_BITMAP_OPTIONS_TARGET, canvas->GetPixelFormat(), dpi_x, dpi_y);
  COM_VERIFY(canvas->CreateBitmap(size, nullptr, 0, &properties, &bitmap_));
}

//////////////////////////////////////////////////////////////////////
//
// Brush
//
class Brush final {
  private: ComPtr<ID2D1SolidColorBrush> brush_;

  public: Brush(ID2D1RenderTarget* render_target, gfx::ColorF::Enum color,
                float alpha = 1.0f);
  public: Brush(ID2D1RenderTarget* render_target, gfx::ColorF color);
  public: ~Brush() = default;

  public: operator ID2D1SolidColorBrush*() const { return brush_; }

  DISALLOW_COPY_AND_ASSIGN(Brush);
};

Brush::Brush(ID2D1RenderTarget* render_target, gfx::ColorF::Enum name,
             float alpha) {
  COM_VERIFY(render_target->CreateSolidColorBrush(gfx::ColorF(name, alpha),
                                                  &brush_));
}

Brush::Brush(ID2D1RenderTarget* render_target, gfx::ColorF color) {
  COM_VERIFY(render_target->CreateSolidColorBrush(color, &brush_));
}

}  // namespace gfx

namespace ui {

class Animatable;

//////////////////////////////////////////////////////////////////////
//
// Animation
//
class Animation  {
  public: typedef double Time;
  public: typedef double TimeSpan;

  public: enum class FillMode {
    Auto,
    Backward,
    Both,
    Forward,
    None,
  };

  public: enum class PlaybackDirection {
    Alternate,
    AlternateReverse,
    Normal,
    Reverse,
  };

  public: enum class State {
    Finish,
    NotStarted,
    Running,
  };

  public: struct Timing {
    TimeSpan delay;
    TimeSpan duration;
    TimeSpan end_delay;
    FillMode fill;
    TimeSpan iteration_start;
    double iterations;
    PlaybackDirection direction;

    Timing();
    ~Timing() = default;
  };

  public: class Variable {
    private: double end_value_;
    private: double start_value_;

    public: Variable(double start_value, double end_value);
    public: ~Variable() = default;

    public: double end_value() const { return end_value_; }
    public: double start_value() const { return start_value_; }

    DISALLOW_COPY_AND_ASSIGN(Variable);
  };

  private: Animatable* animatable_;
  private: Time current_time_;
  private: State state_;
  private: Time start_time_;
  private: Timing timing_;

  public: Animation(Animatable* animatable, const Timing& timing);
  public: ~Animation();

  public: Variable* CreateVariable(double start_value, double end_value);
  public: double GetDouble(const Variable* variable) const;
  public: void Play(Time time);
  public: void Start(Time time);
  public: void Stop();

  DISALLOW_COPY_AND_ASSIGN(Animation);
};

//////////////////////////////////////////////////////////////////////
//
// Animatable
//
class Animatable {
  public: Animatable() = default;
  public: virtual ~Animatable() = default;

  public: virtual void DidFinishAnimation() = 0;
  public: virtual void DidFireAnimationTimer() = 0;

  DISALLOW_COPY_AND_ASSIGN(Animatable);
};

//////////////////////////////////////////////////////////////////////
//
// Animation
//
Animation::Animation(Animatable* animatable, const Timing& timing)
    : animatable_(animatable), current_time_(0), state_(State::NotStarted),
      start_time_(0), timing_(timing) {
}

Animation::~Animation() {
}

Animation::Variable* Animation::CreateVariable(double start_value,
                                               double end_value) {
  return new Variable(start_value, end_value);
}

double Animation::GetDouble(const Variable* variable) const {
  DCHECK_EQ(state_, State::Running);
  auto const max_time = start_time_ + timing_.delay + timing_.duration;
  auto const time = std::min(current_time_ - start_time_ - timing_.delay,
                             max_time);
  auto const duration = timing_.duration - timing_.delay - timing_.end_delay;
  auto const scale = time / duration;
  auto const span = variable->end_value() - variable->start_value();
  return variable->start_value() + span * scale;
}

void Animation::Play(Time current_time) {
  if (state_ == State::NotStarted) {
    Start(current_time);
    return;
  }
  if (state_ != State::Running)
    return;
  current_time_ = current_time;
  if (current_time_ < start_time_ + timing_.delay)
    return;
  animatable_->DidFireAnimationTimer();
  if (current_time < start_time_ + timing_.duration)
    return;
  state_ = State::Finish;
  animatable_->DidFinishAnimation();
}

void Animation::Start(Time time) {
  DCHECK_EQ(state_, State::NotStarted);
  state_ = State::Running;
  start_time_ = time;
  current_time_ = time;
}

void Animation::Stop() {
  Play(start_time_ + timing_.delay + timing_.duration);
}

//////////////////////////////////////////////////////////////////////
//
// Animation::Timing
//
Animation::Timing::Timing()
    : delay(0), duration(0), end_delay(0), fill(FillMode::None),
      iteration_start(0), iterations(0), direction(PlaybackDirection::Normal) {
}

//////////////////////////////////////////////////////////////////////
//
// Animation::Variable
//
Animation::Variable::Variable(double start_value, double end_value)
    : end_value_(end_value), start_value_(start_value) {
}

}  // namespace ui

namespace cc {

class Layer;

//////////////////////////////////////////////////////////////////////
//
// cc::Layer
//
class Layer : protected ui::Animatable {
  private: std::unique_ptr<ui::Animation> animation_;
  private: gfx::RectF bounds_;
  private: std::vector<Layer*> child_layers_;
  private: bool is_active_;
  private: std::unique_ptr<gfx::SwapChain> swap_chain_;
  private: ComPtr<IDCompositionVisual2> visual_;

  public: Layer(IDCompositionDesktopDevice* composition_device);
  public: virtual ~Layer();

  public: operator IDCompositionVisual2*() const { return visual_; }

  public: const gfx::RectF& bounds() const { return bounds_; }
  public: ID2D1DeviceContext* d2d_device_context() const {
    return swap_chain_->d2d_device_context();
  }
  protected: bool is_active() const { return is_active_; }
  public: gfx::SwapChain* swap_chain() const { return swap_chain_.get(); }
  public: IDCompositionVisual2* visual() const { return visual_; }

  public: void AppendChild(Layer* new_child);
  public: virtual void DidActive();
  protected: virtual void DidChangeBounds();
  public: virtual void DidInactive();
  public: virtual bool DoAnimate(uint32_t tick_count);
  public: void Present();
  public: void SetBounds(const gfx::RectF& new_bounds);

  // ui::Animatable
  private: virtual void DidFinishAnimation() override;
  private: virtual void DidFireAnimationTimer() override;

  DISALLOW_COPY_AND_ASSIGN(Layer);
};

//////////////////////////////////////////////////////////////////////
//
// Layer
//
Layer::Layer(IDCompositionDesktopDevice* composition_device)
    : is_active_(false) {
  COM_VERIFY(composition_device->CreateVisual(&visual_));
  COM_VERIFY(visual_->SetBitmapInterpolationMode(
      DCOMPOSITION_BITMAP_INTERPOLATION_MODE_LINEAR));
  COM_VERIFY(visual_->SetBorderMode(DCOMPOSITION_BORDER_MODE_SOFT));

  ComPtr<IDCompositionVisualDebug> debug_visual;
  COM_VERIFY(debug_visual.QueryFrom(visual_));
  COM_VERIFY(debug_visual->EnableHeatMap(gfx::ColorF(0, 255, 0, 0.5)));
  //COM_VERIFY(debug_visual->EnableRedrawRegions());
}

Layer::~Layer() {
  visual_->SetContent(nullptr);
  visual_->RemoveAllVisuals();
}

void Layer::AppendChild(Layer* new_child) {
  child_layers_.push_back(new_child);
  COM_VERIFY(visual_->AddVisual(new_child->visual_, true, nullptr));
}

void Layer::DidActive() {
  if (is_active_)
    return;
  is_active_ = true;
  for (auto const child : child_layers_) {
    child->DidActive();
  }
}

void Layer::DidChangeBounds() {
}

void Layer::DidInactive() {
  if (!is_active_)
    return;
  is_active_ = false;
  for (auto const child : child_layers_) {
    child->DidInactive();
  }
}

bool Layer::DoAnimate(uint32_t tick_count) {
  auto animated = false;
  for (auto const child : child_layers_) {
    animated |= child->DoAnimate(tick_count);
  }
  return animated;
}

void Layer::Present() {
  swap_chain_->Present();
}

void Layer::SetBounds(const gfx::RectF& new_bounds) {
  auto changed = false;
  if (bounds_.left() != new_bounds.left()) {
    COM_VERIFY(visual_->SetOffsetX(new_bounds.left()));
    bounds_.set_origin(gfx::PointF(new_bounds.left(), bounds_.top()));
    changed = true;
  }
  if (bounds_.top () != new_bounds.top()) {
    COM_VERIFY(visual_->SetOffsetY(new_bounds.top()));
    bounds_.set_origin(gfx::PointF(bounds_.left(), new_bounds.top()));
    changed = true;
  }

  if (bounds_.size() != new_bounds.size()) {
    bounds_.set_size(new_bounds.size());
    D2D1_SIZE_U size = {
      static_cast<uint32_t>(bounds_.width()),
      static_cast<uint32_t>(bounds_.height())
    };

    if (swap_chain_) {
      swap_chain_->DidResize(size);
    } else {
      // Create swap chain and d2d device context
      swap_chain_.reset(new gfx::SwapChain(
          gfx::Factory::instance()->dxgi_device(), size));
      COM_VERIFY(visual_->SetContent(swap_chain_->swap_chain()));
    }
    changed = true;
  }

  if (changed)
    DidChangeBounds();
}

// ui::Animation
void Layer::DidFinishAnimation() {
  animation_.reset();
}

void Layer::DidFireAnimationTimer() {
}

}  // namespace cc

namespace ui {

//////////////////////////////////////////////////////////////////////
//
// Window
//
class Window {
  protected: class Creator {
    public: Creator(Window* window);
    public: ~Creator();
  };
  friend class Creator;

  private: RECT bounds_;
  private: HWND hwnd_;
  private: bool is_active_;

  protected: Window();
  protected: ~Window();

  public: operator HWND() const { return hwnd_; }

  public: const RECT& bounds() const { return bounds_; }
  public: bool is_active() const { return is_active_; }

  protected: virtual void DidActive();
  protected: virtual void DidCreate();
  protected: virtual void DidInactive();
  protected: virtual void DidResize();

  protected: static LPWSTR GetWindowClass();
  private: static Window* GetWindowFromHwnd(HWND hwnd);
  protected: virtual LRESULT OnMessage(UINT message, WPARAM wParam,
                                       LPARAM lParam);
  protected: virtual void WillDestroy();
  private: static LRESULT CALLBACK WindowProc(HWND hwnd, UINT message,
                                              WPARAM wParam, LPARAM lParam);

  DISALLOW_COPY_AND_ASSIGN(Window);
};

//////////////////////////////////////////////////////////////////////
//
// Window::Creator
//
static Window* global_creating_window;

Window::Creator::Creator(Window* window) {
  global_creating_window = window;
}

Window::Creator::~Creator(){
  global_creating_window = nullptr;
}

//////////////////////////////////////////////////////////////////////
//
// Window
//
Window::Window() : hwnd_(nullptr), is_active_(false) {
}

Window::~Window() {
}

void Window::DidActive() {
  is_active_ = true;
}

void Window::DidCreate() {
}

void Window::DidInactive() {
  is_active_ = false;
}

void Window::DidResize() {
}

LPWSTR Window::GetWindowClass() {
  static LPWSTR class_name;
  if (class_name)
    return class_name;
  WNDCLASSEX wcex = { sizeof(WNDCLASSEX) };
  wcex.style = CS_HREDRAW | CS_VREDRAW;
  wcex.lpfnWndProc = Window::WindowProc;
  wcex.cbClsExtra = 0;
  wcex.cbWndExtra = sizeof(LONG_PTR);
  wcex.hInstance = HINST_THISCOMPONENT;
  wcex.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW+1);;
  wcex.lpszMenuName = nullptr;
  wcex.hCursor = ::LoadCursor(nullptr, IDC_ARROW);
  wcex.lpszClassName = L"Window";
  class_name = MAKEINTATOM(::RegisterClassEx(&wcex));
  return class_name;
}

Window* Window::GetWindowFromHwnd(HWND hwnd) {
  auto const window = reinterpret_cast<Window*>(
      ::GetWindowLongPtr(hwnd, GWLP_USERDATA));
  if (window)
    return window;
  ::SetWindowLongPtr(hwnd, GWLP_USERDATA,
                     reinterpret_cast<LONG_PTR>(global_creating_window));
  global_creating_window->hwnd_ = hwnd;
  return global_creating_window;
}

LRESULT Window::OnMessage(UINT message, WPARAM wParam, LPARAM lParam) {
  switch (message) {
    case WM_ACTIVATE:
      is_active_ = wParam != WA_INACTIVE;
      if (is_active_)
        DidActive();
      else
        DidInactive();
      return 0;
    case WM_CREATE:
      ::GetClientRect(*this, &bounds_);
      DidCreate();
      return 1;
    case WM_DESTROY:
      WillDestroy();
      break;
    case WM_NCDESTROY:
      ::PostQuitMessage(0);
      return TRUE;
    case WM_WINDOWPOSCHANGED: {
      auto const wp = reinterpret_cast<WINDOWPOS*>(lParam);
      if (wp->flags & SWP_NOSIZE)
        return 0;
      if (!::IsIconic(*this)) {
        ::GetClientRect(*this, &bounds_);
        DidResize();
      }
      return 0;
    }
  }
  return ::DefWindowProc(hwnd_, message, wParam, lParam);
}

LRESULT Window::WindowProc(HWND hwnd, UINT message, WPARAM wParam,
                          LPARAM lParam) {
  auto const window = GetWindowFromHwnd(hwnd);
  return window->OnMessage(message, wParam, lParam);
}

void Window::WillDestroy() {
}

//////////////////////////////////////////////////////////////////////
//
// Schedulable
//
class Schedulable {
  protected: Schedulable() = default;
  protected: virtual ~Schedulable() = default;

  public: virtual void DoAnimate() = 0;

  DISALLOW_COPY_AND_ASSIGN(Schedulable);
};

//////////////////////////////////////////////////////////////////////
//
// Scheduler
//
class Scheduler final : public Singleton<Scheduler> {
  public: enum class Method {
    NoWait,
    Timer,
    Waitable,
  };

  private: std::unordered_set<Schedulable*> animators_;

  public: explicit Scheduler();
  public: virtual ~Scheduler();

  public: void Add(Schedulable* animator);
  private: void DidFireTimer();
  public: void Run(Method method = Method::Waitable);

  private: static void CALLBACK TimerProc(HWND hwnd, UINT message,
                                          UINT_PTR timer_id, DWORD time);
  DISALLOW_COPY_AND_ASSIGN(Scheduler);
};

Scheduler::Scheduler() {
}

Scheduler::~Scheduler() {
}

void Scheduler::Add(Schedulable* animator) {
  animators_.insert(animator);
}

void Scheduler::DidFireTimer() {
  for (auto const animator : animators_) {
    animator->DoAnimate();
  }
}

void Scheduler::Run(Method method) {
  switch (method) {
    case Method::Timer: {
      ::SetTimer(nullptr, reinterpret_cast<UINT_PTR>(this), 1,
                 Scheduler::TimerProc);
      MSG msg;
      while (::GetMessage(&msg, nullptr, 0, 0)) {
        ::TranslateMessage(&msg);
        ::DispatchMessage(&msg);
      }
      return;
    }
    case Method::NoWait:
    case Method::Waitable: {
      auto const waitable = method == Method::NoWait ? nullptr :
        ::CreateEvent(nullptr, false, false, nullptr);
      MSG msg;
      for (;;) {
        if (::PeekMessage(&msg, nullptr, 0, 0, PM_NOREMOVE)) {
          if (!::GetMessage(&msg, nullptr, 0, 0))
            break;
          ::TranslateMessage(&msg);
          ::DispatchMessage(&msg);
        } else {
          if (waitable)
            ::WaitForSingleObject(waitable, 1);
          DidFireTimer();
        }
      }
      if (waitable)
        ::CloseHandle(waitable);
      return;
    }
  }
  NOTREACHED();
}

void CALLBACK Scheduler::TimerProc(HWND, UINT, UINT_PTR, DWORD) {
  Scheduler::instance()->DidFireTimer();
}

}  // namespace ui

namespace my {

//////////////////////////////////////////////////////////////////////
//
// Sampling
//
class Sampling {
  private: float maximum_;
  private: float minimum_;
  private: size_t max_samples_;
  private: std::list<float> samples_;

  public: Sampling(size_t max_samples = 100);
  public: ~Sampling() = default;

  public: float last() const { return samples_.back(); }
  public: float maximum() const { return maximum_; }
  public: float minimum() const { return minimum_; }

  public: void AddSample(float);
  public: void Paint(ID2D1RenderTarget* canvas, const gfx::Brush& brush,
                     const gfx::RectF& bounds) const;

  DISALLOW_COPY_AND_ASSIGN(Sampling);
};

Sampling::Sampling(size_t max_samples) :
    max_samples_(max_samples), samples_(max_samples) {
  maximum_ = minimum_ = samples_.front();
}

void Sampling::AddSample(float sample) {
  auto const discard_sample = samples_.front();
  samples_.pop_front();
  samples_.push_back(sample);
  if (discard_sample != maximum_ && discard_sample != minimum_)
    return;
  maximum_ = minimum_ = samples_.front();
  for (auto const sample : samples_) {
    maximum_ = std::max(maximum_, sample);
    minimum_ = std::min(minimum_, sample);
  }
}

void Sampling::Paint(ID2D1RenderTarget* canvas, const gfx::Brush& brush,
                     const gfx::RectF& bounds) const {
  auto const maximum = maximum_ * 1.1f;
  auto const minimum = minimum_ * 0.9f;
  auto const span = maximum == minimum ? 1.0f : maximum - minimum;
  auto const scale = bounds.height() / span;
  auto  last_point = gfx::PointF(
      bounds.left(), bounds.bottom() - (samples_.front() - minimum_) * scale);
  auto x_step = bounds.width() / samples_.size();
  auto sum = 0.0f;
  for (auto const sample : samples_) {
    sum += sample;
    auto const curr_point = gfx::PointF(
        last_point.x() + x_step, bounds.bottom() - (sample - minimum_) * scale);
    canvas->DrawLine(last_point, curr_point, brush, 1.0f);
    last_point = curr_point;
  }
  auto const avg = sum / samples_.size();
  auto const avg_y = bounds.bottom()- (avg - minimum_) * scale;
  canvas->DrawLine(gfx::PointF(bounds.left(), avg_y),
                   gfx::PointF(bounds.right(), avg_y),
                   brush, 2.0f);
  COM_VERIFY(canvas->Flush());
}

//////////////////////////////////////////////////////////////////////
//
// BoxShadow
//
struct BoxShadow {
  gfx::SizeF offset;
  float blur_radius;
  gfx::ColorF color;
};

//////////////////////////////////////////////////////////////////////
//
// Card
//
class Card : public cc::Layer {
  private: enum class State {
    Active,
    Inactive,
    WillBeInactive,
  };

  private: gfx::RectF content_bounds_;
  std::vector<BoxShadow> shadows_;
  private: gfx::SizeF shadow_size_;
  private: State state_;

  protected: Card(IDCompositionDesktopDevice* composition_device);
  protected: virtual ~Card() = default;

  public: const gfx::RectF& content_bounds() const { return content_bounds_; }

  protected: void PaintBackground(ID2D1DeviceContext* canvas) const;

  // cc::Layer
  protected: virtual void DidChangeBounds() override;
  protected: virtual void DidInactive() override;
  protected: virtual bool DoAnimate(uint32_t tick_count) override;

  DISALLOW_COPY_AND_ASSIGN(Card);
};

Card::Card(IDCompositionDesktopDevice* composition_device)
    : Layer(composition_device), state_(State::Inactive) {
  // Below values are obtained from
  // http://www.polymer-project.org/tools/designer/
  shadows_ = {
    {gfx::SizeF(0.0f, 2.0f), 4.0f, gfx::ColorF(0, 0, 0, 0.098f)},
    {gfx::SizeF(0.0f, 0.0f), 3.0f, gfx::ColorF(0, 0, 0, 0.098f)}
  };
  for (const auto& shadow : shadows_) {
    shadow_size_.set_width(std::max(shadow_size_.width(),
        shadow.offset.width() + shadow.blur_radius * 2));
    shadow_size_.set_height(std::max(shadow_size_.height(),
        shadow.offset.height() + shadow.blur_radius * 2));
  }
}

void Card::PaintBackground(ID2D1DeviceContext* canvas) const {
  auto const radius = 2.0f;
  canvas->Clear(gfx::ColorF(gfx::ColorF::White, 0.0f));

  ComPtr<ID2D1Image> current_target;
  canvas->GetTarget(&current_target);

  gfx::Bitmap bitmap(canvas, canvas->GetPixelSize());

  ComPtr<ID2D1Effect> blur_effect;
  COM_VERIFY(canvas->CreateEffect(CLSID_D2D1GaussianBlur, &blur_effect));

  for (const auto& shadow : shadows_) {
    const auto shadow_size = gfx::SizeF(shadow.blur_radius,
                                        shadow.blur_radius);
    const auto shadow_bounds = gfx::RectF(
       content_bounds().origin() + shadow.offset,
       content_bounds().size());

    canvas->SetTarget(bitmap);
    canvas->Clear(gfx::ColorF(0, 0, 0, 0));
    canvas->FillRoundedRectangle(
         D2D1::RoundedRect(shadow_bounds, radius, radius),
         gfx::Brush(canvas, shadow.color));

    blur_effect->SetInput(0, bitmap);
    COM_VERIFY(blur_effect->SetValue(D2D1_GAUSSIANBLUR_PROP_STANDARD_DEVIATION,
                                     shadow.blur_radius));
    canvas->SetTarget(current_target);
    canvas->DrawImage(blur_effect, gfx::PointF());
    COM_VERIFY(canvas->Flush());
  }

  canvas->FillRoundedRectangle(D2D1::RoundedRect(content_bounds(),
                                                 radius, radius),
                               gfx::Brush(canvas, gfx::ColorF::White));
}

// cc::Layer
void Card::DidChangeBounds() {
  content_bounds_.set_size(bounds().size() - shadow_size_);
}

void Card::DidInactive() {
  Layer::DidInactive();
  state_ = State::WillBeInactive;
}

bool Card::DoAnimate(uint32_t) {
  if (!swap_chain()->IsReady())
    return false;

  if (state_ != State::WillBeInactive)
    return state_ == State::Active;

  state_ = State::Inactive;
  auto const bounds = content_bounds();

  // Paint "Paused" in center of layer.
  auto const font_size = 40;
  ComPtr<IDWriteTextFormat> text_format;
  COM_VERIFY(gfx::Factory::instance()->dwrite()->CreateTextFormat(
    L"Verdana", nullptr, DWRITE_FONT_WEIGHT_REGULAR, DWRITE_FONT_STYLE_NORMAL,
    DWRITE_FONT_STRETCH_NORMAL, font_size, L"en-us", &text_format));

  base::string16 text(L"Paused");
  ComPtr<IDWriteTextLayout> text_layout;
  COM_VERIFY(gfx::Factory::instance()->dwrite()->CreateTextLayout(
      text.data(), static_cast<UINT>(text.length()), text_format,
      bounds.width(), bounds.width(),
      &text_layout));

  DWRITE_TEXT_METRICS text_metrics;
  COM_VERIFY(text_layout->GetMetrics(&text_metrics));

  auto const text_origin = gfx::PointF(
    bounds.left() + (bounds.width() - text_metrics.width) / 2,
    bounds.top() + (bounds.height() - text_metrics.height) / 2);

  auto const canvas = d2d_device_context();
  canvas->BeginDraw();

  canvas->FillRectangle(bounds,
    gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::Black, 0.4f)));

  gfx::Brush text_brush(canvas, gfx::ColorF(gfx::ColorF::White, 0.9f));
  canvas->DrawTextLayout(text_origin, text_layout, text_brush);

  COM_VERIFY(canvas->EndDraw());
  swap_chain()->Present();
  return true;
}

//////////////////////////////////////////////////////////////////////
//
// CartoonCard
//
class CartoonCard : public Card {
  private: class Ball {
    private: float angle_;
    private: gfx::PointF center_;
    private: gfx::SizeF motion_;
    private: float size_;
    private: uint32_t tick_count_;

    public: Ball(float angle, float size, const gfx::PointF& center,
                 const gfx::SizeF& motion,
                 uint32_t tick_count);
    public: ~Ball() = default;

    public: const gfx::PointF& center() const { return center_; }
    public: float size() const { return size_; }

    public: void DidChangeBounds(const gfx::RectF& bounds);
    public: void DoAnimate(ID2D1RenderTarget* canvas,
                           const gfx::RectF& bounds,
                           uint32_t tick_count);
    public: void DidColision(const Ball& other);
  };

  private: std::vector<std::unique_ptr<Ball>> balls_;
  private: uint32_t last_tick_count_;
  private: DXGI_FRAME_STATISTICS last_stats_;
  private: int not_present_count_;
  private: Sampling present_sample_;
  private: ComPtr<IDWriteTextFormat> text_format_;
  private: Sampling tick_count_sample_;

  public: CartoonCard(IDCompositionDesktopDevice* composition_device);
  public: virtual ~CartoonCard();

  // cc::Layer
  private: virtual void DidChangeBounds() override;
  private: virtual bool DoAnimate(uint32_t tick_count) override;

  DISALLOW_COPY_AND_ASSIGN(CartoonCard);
};

//////////////////////////////////////////////////////////////////////
//
// CartoonCard
//
CartoonCard::CartoonCard(IDCompositionDesktopDevice* composition_device)
    : Card(composition_device), balls_(5),
      last_tick_count_(::GetTickCount()), not_present_count_(0) {
  last_stats_ = {0};

  balls_[0].reset(new Ball(0.0f, 10.0f,
                           gfx::PointF(10, 10), gfx::SizeF(1.3, 1.2),
                           last_tick_count_));
  balls_[1].reset(new Ball(30.0f, 10.0f,
                           gfx::PointF(90, 10), gfx::SizeF(-2.0, 1.5),
                           last_tick_count_));
  balls_[2].reset(new Ball(90.0f, 15.0f,
                           gfx::PointF(30, 90), gfx::SizeF(1.0, -1.0),
                           last_tick_count_));
  balls_[3].reset(new Ball(180.0f, 20.0f,
                           gfx::PointF(90, 90), gfx::SizeF(-1.0, -1.0),
                           last_tick_count_));
  balls_[4].reset(new Ball(180.0f, 13.0f,
                           gfx::PointF(50, 50), gfx::SizeF(-1.0, -1.0),
                           last_tick_count_));

  auto const font_size = 13;
  COM_VERIFY(gfx::Factory::instance()->dwrite()->CreateTextFormat(
    L"Consolas", nullptr, DWRITE_FONT_WEIGHT_REGULAR, DWRITE_FONT_STYLE_NORMAL,
    DWRITE_FONT_STRETCH_NORMAL, font_size, L"en-us", &text_format_));
}

CartoonCard::~CartoonCard() {
}

void CartoonCard::DidChangeBounds() {
  Card::DidChangeBounds();
  for (const auto& ball : balls_) {
    ball->DidChangeBounds(content_bounds());
  }
}

bool CartoonCard::DoAnimate(uint32_t tick_count) {
  Card::DoAnimate(tick_count);

  if (!is_active())
    return false;

  if (!swap_chain()->IsReady()) {
    ++not_present_count_;
    return false;
  }

  // Statistics
  DXGI_FRAME_STATISTICS stats = {0};
  // Ignore errors. |GetFrameStatistics()| returns
  // DXGI_ERROR_FRAME_STATISTICS_DISJOINT.
  swap_chain()->swap_chain()->GetFrameStatistics(&stats);

  tick_count_sample_.AddSample(tick_count - last_tick_count_);
  last_tick_count_ = tick_count;

  present_sample_.AddSample(not_present_count_);
  not_present_count_ = 0;

  auto const canvas = d2d_device_context();
  canvas->BeginDraw();
  PaintBackground(canvas);

  for (auto& ball : balls_) {
    ball->DoAnimate(canvas, content_bounds(), tick_count);
  }
  for (auto& ball : balls_) {
    for (auto& other : balls_) {
      if (ball == other)
        continue;
      auto const distance = ball->center().Distance(other->center());
      if (distance > ball->size() && distance > other->size())
        continue;
      ball->DidColision(*other);
      break;
    }
  }

  // Sample graph
  tick_count_sample_.Paint(canvas,
      gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::Red, 0.5f)),
      gfx::RectF(gfx::PointF(content_bounds().left(),
                             content_bounds().bottom() - 20),
                 content_bounds().bottom_right()));
  present_sample_.Paint(canvas,
      gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::Blue, 0.5f)),
      gfx::RectF(gfx::PointF(content_bounds().left(),
                             content_bounds().bottom() - 40),
                 content_bounds().bottom_right() - gfx::SizeF(0, 20)));

  std::basic_ostringstream<base::char16> stream;
  stream << L"(Red) TickCount=" << tick_count_sample_.minimum() <<
    L" " << tick_count_sample_.maximum() <<
    L" " << tick_count_sample_.last() << std::endl;
  stream << L"(Blue) NotPresentCount=" << present_sample_.minimum() <<
    L" " << present_sample_.maximum() <<
    L" " << present_sample_.last() << std::endl;
  stream << L"PresentCount=" <<
      stats.PresentCount - last_stats_.PresentCount << std::endl;
  stream << L"PresentRefreshCount=" <<
      stats.PresentRefreshCount - last_stats_.PresentRefreshCount << std::endl;
  stream << L"SyncQPCTime=" <<
      stats.SyncQPCTime.QuadPart -
          last_stats_.SyncQPCTime.QuadPart << std::endl;
  stream << L"SyncGPUTime=" <<
      stats.SyncGPUTime.QuadPart -
          last_stats_.SyncGPUTime.QuadPart << std::endl;

  const auto text = stream.str();
  ComPtr<IDWriteTextLayout> text_layout;
  COM_VERIFY(gfx::Factory::instance()->dwrite()->CreateTextLayout(
      text.data(), static_cast<UINT>(text.length()), text_format_,
      content_bounds().width(), content_bounds().height(), &text_layout));

  gfx::Brush text_brush(canvas, gfx::ColorF(gfx::ColorF::Black, 0.5f));
  canvas->DrawTextLayout(gfx::PointF(5.0f, 5.0f), text_layout, text_brush,
                         D2D1_DRAW_TEXT_OPTIONS_CLIP);
  COM_VERIFY(canvas->EndDraw());
  swap_chain()->Present();

  last_stats_ = stats;
  last_tick_count_ = tick_count;
  return true;
}

//////////////////////////////////////////////////////////////////////
//
// CartoonCard::Ball
//
CartoonCard::Ball::Ball(float angle, float size,
                        const gfx::PointF& center,
                        const gfx::SizeF& motion, uint32_t tick_count)
    : angle_(angle), center_(center), motion_(motion), size_(size),
      tick_count_(tick_count) {
  motion_ = 1.0f;
}

void CartoonCard::Ball::DidChangeBounds(const gfx::RectF& bounds) {
  center_.set_x(std::min(center_.x(), bounds.right() - size_));
  center_.set_y(std::min(center_.y(), bounds.bottom() - size_));
}

void CartoonCard::Ball::DoAnimate(ID2D1RenderTarget* canvas,
                                  const gfx::RectF& content_bounds,
                                  uint32_t tick_count) {
  if (tick_count_ == tick_count)
    return;
  auto const bounds = content_bounds - size_;
  auto const tick_delta = std::max((tick_count - tick_count_) / 16, 1u);
  tick_count_ = tick_count;
  for (auto count = 0u; count < tick_delta; ++count) {
    center_ += motion_;
    if (bounds.Contains(center_))
      continue;
    if (center_.x() < bounds.left() || center_.x() >= bounds.right())
      motion_.set_width(-motion_.width());
    if (center_.y() < bounds.top() || center_.y() >= bounds.bottom())
      motion_.set_height(-motion_.height());
  }

  angle_ = ::fmod(angle_ + tick_delta, 360.0f);

  canvas->SetTransform(D2D1::Matrix3x2F::Rotation(angle_, center_));

  D2D1_ELLIPSE ellipse;
  ellipse.point = center_;
  ellipse.radiusX = size_;
  ellipse.radiusY = size_;
  canvas->FillEllipse(ellipse,
      gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::Blue, 0.5)));

  auto const rect_size = size_ * 0.5f;
  canvas->FillRectangle(
      gfx::RectF(center_.x() - rect_size, center_.y() - rect_size,
                 center_.x() + rect_size, center_.y() + rect_size),
      gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::Green, 0.7f)));

  canvas->SetTransform(D2D1::IdentityMatrix());
  COM_VERIFY(canvas->Flush());
}

void CartoonCard::Ball::DidColision(const Ball& other) {
  if (size() > other.size())
    return;
  motion_ = gfx::SizeF(-motion_.width(), -motion_.height());
}

//////////////////////////////////////////////////////////////////////
//
// StatusLayer
//
class StatusLayer : public cc::Layer {
  private: ComPtr<IDCompositionDesktopDevice> composition_device_;
  private: DCOMPOSITION_FRAME_STATISTICS last_stats_;
  private: uint32_t last_tick_count_;
  private: Sampling sample_duration_;
  private: Sampling sample_last_frame_;
  private: Sampling sample_next_frame_;
  private: Sampling sample_tick_;
  private: ComPtr<IDWriteTextFormat> text_format_;
  private: ComPtr<IDWriteTextLayout> text_layout_;

  public: StatusLayer(IDCompositionDesktopDevice* composition_device);
  public: virtual ~StatusLayer();

  private: virtual bool DoAnimate(uint32_t tick_count) override;

  DISALLOW_COPY_AND_ASSIGN(StatusLayer);
};

StatusLayer::StatusLayer(IDCompositionDesktopDevice* composition_device)
    : Layer(composition_device), composition_device_(composition_device),
      last_tick_count_(::GetTickCount()), sample_duration_(100),
      sample_last_frame_(100), sample_next_frame_(100), sample_tick_(100) {
  COM_VERIFY(composition_device_->GetFrameStatistics(&last_stats_));

  auto const font_size = 13;
  COM_VERIFY(gfx::Factory::instance()->dwrite()->CreateTextFormat(
    L"Consolas", nullptr, DWRITE_FONT_WEIGHT_REGULAR, DWRITE_FONT_STYLE_NORMAL,
    DWRITE_FONT_STRETCH_NORMAL, font_size, L"en-us", &text_format_));
}

StatusLayer::~StatusLayer() {
}

bool StatusLayer::DoAnimate(uint32_t tick_count) {
  DCOMPOSITION_FRAME_STATISTICS stats;
  COM_VERIFY(composition_device_->GetFrameStatistics(&stats));

  if (!swap_chain()->IsReady())
    return false;

  // Update samples
  sample_tick_.AddSample(tick_count - last_tick_count_);
  last_tick_count_ = tick_count;

  sample_duration_.AddSample(
    ((stats.currentTime - last_stats_.currentTime) * 1000 /
     stats.timeFrequency).QuadPart);
  sample_last_frame_.AddSample(
    ((stats.lastFrameTime - last_stats_.lastFrameTime) * 1000 /
     stats.timeFrequency).QuadPart);
  sample_next_frame_.AddSample(
    ((stats.nextEstimatedFrameTime - last_stats_.nextEstimatedFrameTime) *
     1000 / stats.timeFrequency).QuadPart);
  last_stats_ = stats;

  auto const bounds = gfx::RectF(gfx::PointF(), this->bounds().size());
  auto const canvas = d2d_device_context();
  canvas->BeginDraw();
  canvas->Clear(gfx::ColorF(0, 0, 0, 0.5));

  // Paint graph
  sample_next_frame_.Paint(canvas,
      gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::Red, 0.5f)),
      gfx::RectF(gfx::PointF(bounds.left(), bounds.bottom() - 20),
                 bounds.bottom_right()));
  sample_duration_.Paint(canvas,
      gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::Yellow, 0.5f)),
      gfx::RectF(gfx::PointF(bounds.left(), bounds.bottom() - 40),
                 bounds.bottom_right() - gfx::SizeF(0, 20)));
  sample_last_frame_.Paint(canvas,
      gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::Blue, 0.5f)),
      gfx::RectF(gfx::PointF(bounds.left(), bounds.bottom() - 60),
                 bounds.bottom_right() - gfx::SizeF(0, 40)));
  sample_tick_.Paint(canvas,
      gfx::Brush(canvas, gfx::ColorF(gfx::ColorF::White, 0.5f)),
      gfx::RectF(gfx::PointF(bounds.left(), bounds.bottom() - 80),
                 bounds.bottom_right() - gfx::SizeF(0, 60)));

  // Samples values
  std::basic_ostringstream<base::char16> stream;
  stream << L"(White) Tick=" << sample_tick_.minimum() << L" " <<
      sample_tick_.maximum() << L" " << sample_tick_.last() << std::endl;
  stream << L"(Blue) LastFrameTime=" << sample_last_frame_.minimum() <<
      L" " << sample_last_frame_.maximum() <<
      L" " << sample_last_frame_.last() << std::endl;
  stream << L"(Yellow) CurrentTime=" << sample_duration_.minimum() <<
      L" " << sample_duration_.maximum() <<
      L" " << sample_duration_.last() << std::endl;
  stream << L"(Red) NextFrame=" << sample_next_frame_.minimum() <<
      L" " << sample_next_frame_.maximum() <<
      L" " << sample_next_frame_.last() << std::endl;
  stream << L"rate=" << stats.currentCompositionRate.Numerator <<
      L"/" << stats.currentCompositionRate.Denominator << std::endl;
  stream << L"hz=" << stats.timeFrequency.QuadPart << std::endl;

  const auto text = stream.str();

  text_layout_.reset();
  COM_VERIFY(gfx::Factory::instance()->dwrite()->CreateTextLayout(
      text.data(), static_cast<UINT>(text.length()), text_format_,
      bounds.width(), bounds.height(), &text_layout_));

  gfx::Brush text_brush(canvas, gfx::ColorF::LightGray);
  canvas->DrawTextLayout(gfx::PointF(5.0f, 5.0f), text_layout_, text_brush,
                         D2D1_DRAW_TEXT_OPTIONS_CLIP);

  COM_VERIFY(canvas->EndDraw());
  Present();
  return true;
}

//////////////////////////////////////////////////////////////////////
//
// DemoApp
//
class DemoApp final : public ui::Window, private ui::Schedulable,
                      private ui::Animatable {
  private: class Animation {
    public: enum class Type {
      Scroll,
      Zoom,
    };

    private: std::unique_ptr<ui::Animation> animation_;
    private: Type type_;
    private: std::unique_ptr<ui::Animation::Variable> variable1_;

    public: Animation(Type type, ui::Animatable* animatable,
                      const ui::Animation::Timing& timing);
    public: ~Animation();

    public: Type type() const { return type_; }
    public: double value1() const;

    public: void Play(ui::Animation::Time current_time);
    public: void SetValues1(double start, double end);
    public: void Start();
  };

  private: std::unique_ptr<Animation> animation_;
  private: ComPtr<IDCompositionDesktopDevice> composition_device_;
  private: ComPtr<IDCompositionTarget> composition_target_;
  private: uint32_t last_animate_tick_;
  private: std::unique_ptr<CartoonCard> cartoon_layer_;
  private: std::unique_ptr<cc::Layer> root_layer_;
  private: bool should_commit_;
  private: std::unique_ptr<StatusLayer> status_layer_;

  public: DemoApp();
  public: virtual ~DemoApp();

  // ui::Animatable
  private: virtual void DidFinishAnimation() override;
  private: virtual void DidFireAnimationTimer() override;

  // ui::Schedulable
  private: virtual void DoAnimate() override;

  // ui::Window
  private: virtual void DidActive() override;
  private: virtual void DidCreate() override;
  private: virtual void DidInactive() override;
  private: virtual void DidResize() override;
  private: virtual LRESULT OnMessage(UINT message, WPARAM wParam,
                                     LPARAM lParam) override;
  private: virtual void WillDestroy() override;

  DISALLOW_COPY_AND_ASSIGN(DemoApp);
};

DemoApp::DemoApp() : last_animate_tick_(0), should_commit_(false) {
  float dpi_x, dpi_y;
  gfx::Factory::instance()->d2d_factory()->GetDesktopDpi(&dpi_x, &dpi_y);

  Window::Creator creator(this);
  auto const hwnd = ::CreateWindow(
    GetWindowClass(),
    L"Window Title",
    WS_OVERLAPPEDWINDOW,
    CW_USEDEFAULT,
    CW_USEDEFAULT,
    static_cast<UINT>(ceil(640.f * dpi_x / 96.f)),
    static_cast<UINT>(ceil(800.f * dpi_y / 96.f)),
    nullptr,
    nullptr,
    HINST_THISCOMPONENT,
    nullptr);
  if (!hwnd)
    return;
  ::ShowWindow(hwnd, SW_SHOWNORMAL);
  ui::Scheduler::instance()->Add(this);
}

DemoApp::~DemoApp() {
}

// ui::Animation
void DemoApp::DidFinishAnimation() {
  animation_.reset();
}

void DemoApp::DidFireAnimationTimer() {
  switch (animation_->type()) {
    case Animation::Type::Scroll: {
      auto const origin_top = animation_->value1();
      root_layer_->SetBounds(gfx::RectF(
        gfx::PointF(root_layer_->bounds().left(), origin_top),
        root_layer_->bounds().size()));
      should_commit_ = true;
      break;
    }
  }
}

// ui::Schedulable
void DemoApp::DoAnimate() {
  if (!root_layer_)
    return;
  auto const tick_count = ::GetTickCount();
  auto const delta = tick_count - last_animate_tick_;
  auto const kBackgroundAnimate = 100;
  if (!is_active() && delta < kBackgroundAnimate)
    return;
  if (animation_)
    animation_->Play(tick_count);
  last_animate_tick_ = tick_count;
  root_layer_->DoAnimate(tick_count);
  if (should_commit_) {
    composition_device_->Commit();
    should_commit_ = false;
  }
}

// ui::Window
void DemoApp::DidActive() {
  ui::Window::DidActive();
  if (root_layer_)
    root_layer_->DidActive();
}

// Build visual tree and set composition target to this window.
void DemoApp::DidCreate() {
  ui::Window::DidCreate();

  // Create Direct Composition device.
  COM_VERIFY(::DCompositionCreateDevice2(
      gfx::Factory::instance()->dxgi_device(),
      __uuidof(IDCompositionDesktopDevice), composition_device_.location()));
  composition_device_.MustBeNoOtherUse();

  // Build visual tree
  root_layer_.reset(new cc::Layer(composition_device_));

  cartoon_layer_.reset(new CartoonCard(composition_device_));
  root_layer_->AppendChild(cartoon_layer_.get());

  status_layer_.reset(new StatusLayer(composition_device_));
  root_layer_->AppendChild(status_layer_.get());

  // Set composition target to this window.
  COM_VERIFY(composition_device_->CreateTargetForHwnd(
      *this, true, &composition_target_));
  composition_target_.MustBeNoOtherUse();
  COM_VERIFY(composition_target_->SetRoot(root_layer_->visual()));

  // Setup visual tree bounds
  DidResize();
}

void DemoApp::DidInactive() {
  if (root_layer_)
    root_layer_->DidInactive();
}

void DemoApp::DidResize() {
  auto const width = bounds().right - bounds().left;
  auto const height = bounds().bottom - bounds().top;

  auto const tab_height = 32.0f;
  auto const splitter_height = 5.0f;
  auto const pane_height = (height - splitter_height - tab_height) / 2;

  root_layer_->SetBounds(gfx::RectF(gfx::PointF(), gfx::SizeF(width, height)));

  // Resize status visual
  if (status_layer_) {
    const gfx::SizeF status_size(240.0f, 200.0f);
    status_layer_->SetBounds(gfx::RectF(gfx::PointF(20, height / 2),
                                        status_size));

    // Setup transform for status visual
    ComPtr<IDCompositionRotateTransform> rotate_transform;
    COM_VERIFY(composition_device_->CreateRotateTransform(&rotate_transform));
    COM_VERIFY(rotate_transform->SetCenterX(status_size.width() / 2));
    COM_VERIFY(rotate_transform->SetCenterY(status_size.height() / 2));
    COM_VERIFY(rotate_transform->SetAngle(-5));
    COM_VERIFY(status_layer_->visual()->SetTransform(rotate_transform));
  }

  // Paint root visual
  {
    auto const canvas = root_layer_->d2d_device_context();
    canvas->BeginDraw();
    canvas->Clear(gfx::ColorF(0, 0, 0, 0));

    gfx::RectF pane_bounds[2] {
        gfx::RectF(gfx::PointF(0, tab_height), gfx::PointF(width, pane_height)),
        gfx::RectF(gfx::PointF(0, pane_height + splitter_height),
                   gfx::PointF(width, height))
    };
  // Resize cartoon visual
  if (cartoon_layer_)
    cartoon_layer_->SetBounds(pane_bounds[0]);

#if 0
    gfx::Brush white_brush(canvas,
                            gfx::ColorF(gfx::ColorF::White, 0.3f));

    gfx::Brush green_brush(canvas,
                           gfx::ColorF(gfx::ColorF::Green, 0.5f));

    for (auto i = 0; i < 2; ++i) {
      canvas->FillRectangle(pane_bounds[i], white_brush);
      auto const pane_height = pane_bounds[i].bottom - pane_bounds[i].top;
      auto const pane_width = pane_bounds[i].right - pane_bounds[i].left;
      D2D1_ELLIPSE ellipse;
      ellipse.point = gfx::PointF(pane_bounds[i].left + pane_width / 2,
                                    pane_bounds[i].top + pane_height / 2);
      ellipse.radiusX = pane_width / 3;
      ellipse.radiusY = pane_height / 3;
      canvas->FillEllipse(ellipse, green_brush);
    }
#endif

    COM_VERIFY(canvas->EndDraw());
    root_layer_->Present();
  }

  // Update composition
  composition_device_->Commit();
}

LRESULT DemoApp::OnMessage(UINT message, WPARAM wParam, LPARAM lParam) {
  switch (message) {
    case WM_ACTIVATE: {
        MARGINS margins;
        margins.cxLeftWidth = 0;
        margins.cxRightWidth = 0;
        margins.cyBottomHeight = 0;
        margins.cyTopHeight = -1;
        COM_VERIFY(::DwmExtendFrameIntoClientArea(*this, &margins));
        break;
    }
    case WM_PAINT: {
      // Fill window client area with alpha=0.
      PAINTSTRUCT ps;
      auto const hdc = ::BeginPaint(*this, &ps);
      ::FillRect(hdc, &ps.rcPaint,
                 static_cast<HBRUSH>(::GetStockObject(BLACK_BRUSH)));
      ::EndPaint(*this, &ps);
      return 1;
    }
    case WM_MOUSEWHEEL: {
      auto const delta = GET_WHEEL_DELTA_WPARAM(wParam);
      auto const origin = root_layer_->bounds().origin();
      ui::Animation::Timing timing;
      auto const num_frames = 10;
      auto const speed = 10;
      auto const sign = delta > 0 ? 1 : -1;
      timing.duration = 16 * num_frames;
      animation_.reset(new Animation(Animation::Type::Scroll, this, timing));
      animation_->SetValues1(origin.y(),
                             origin.y() + sign * speed * num_frames);
      return 1;
    }
  }
  return ui::Window::OnMessage(message, wParam, lParam);
}

void DemoApp::WillDestroy() {
#if 0
  composition_target_->SetRoot(nullptr);
  root_layer_.reset();
  status_layer_.reset();
  composition_target_.MustBeNoOtherUse();
  composition_target_.reset();
  composition_device_.reset();
#endif
  ui::Window::WillDestroy();
}

//////////////////////////////////////////////////////////////////////
//
// DemoApp::Animation
//
DemoApp::Animation::Animation(Type type,
                              ui::Animatable* animatable,
                              const ui::Animation::Timing& timing)
    : animation_(new ui::Animation(animatable, timing)), type_(type) {
}

DemoApp::Animation::~Animation() {
}

void DemoApp::Animation::Play(ui::Animation::Time current_time) {
  animation_->Play(current_time);
}

double DemoApp::Animation::value1() const {
  return animation_->GetDouble(variable1_.get());
}

void DemoApp::Animation::SetValues1(double start, double end) {
  DCHECK(!variable1_);
  variable1_.reset(animation_->CreateVariable(start, end));
}

}  // namespace my

namespace {
const GUID DXGI_DEBUG_ALL = {
  0xe48ae283, 0xda80, 0x490b, 0x87, 0xe6, 0x43, 0xe9, 0xa9, 0xcf, 0xda, 0x8
};

const GUID DXGI_DEBUG_DXGI = {
  0x25cddaa4, 0xb1c6, 0x47e1, 0xac, 0x3e, 0x98, 0x87, 0x5b, 0x5a, 0x2e, 0x2a
};

void ReportLiveObjects() {
  auto const dll = ::GetModuleHandleW(L"dxgidebug.dll");
  if (!dll)
    return;
  typedef HRESULT (WINAPI  *DXGIGetDebugInterface)(REFIID riid, void **ppDebug);
  DXGIGetDebugInterface func = reinterpret_cast<DXGIGetDebugInterface>(
      ::GetProcAddress(dll, "DXGIGetDebugInterface"));
  if (!func)
    return;
  ComPtr<IDXGIDebug> repoter;
  COM_VERIFY(func(__uuidof(IDXGIDebug), repoter.location()));
  repoter->ReportLiveObjects(DXGI_DEBUG_DXGI, DXGI_DEBUG_RLO_ALL);
}
}  // namespace

//////////////////////////////////////////////////////////////////////
//
// WinMain
//
int WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
  std::vector<SingletonBase*> singletons;
  all_singletons = &singletons;
  ::AllocConsole();
  ComInitializer com_initializer;
  my::DemoApp application;
  ui::Scheduler::instance()->Run(ui::Scheduler::Method::NoWait);
  for (auto const singleton : singletons) {
    delete singleton;
  }
  ReportLiveObjects();
  return 0;
}
