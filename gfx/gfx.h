// Copyright (c) 2014 Project Vogue. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#if !defined(INCLUDE_gfx_gfx_h)
#define INCLUDE_gfx_gfx_h

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
  public: bool empty() const { return width() <= 0 || height() <= 0; }
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
class Factory final : public common::Singleton<Factory> {
  DECLARE_SINGLETON_CLASS(Factory);

  private: common::ComPtr<ID2D1Factory1> d2d_factory_;
  private: common::ComPtr<IDWriteFactory> dwrite_factory_;

  private: Factory();
  private: virtual ~Factory();

  public: ID2D1Factory1* d2d_factory() const { return d2d_factory_; }
  public: IDWriteFactory* dwrite() const { return dwrite_factory_; }

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
}

Factory::~Factory(){
  d2d_factory_.reset();
  dwrite_factory_.reset();
}

//////////////////////////////////////////////////////////////////////
//
// DxDevice
//
class DxDevice {
  private: common::ComPtr<ID2D1Device> d2d_device_;
  private: common::ComPtr<IDXGIDevice3> dxgi_device_;
  private: common::ComPtr<IDXGIFactory2> dxgi_factory_;

  public: DxDevice();
  public: ~DxDevice();

  public: ID2D1Device* d2d_device() const { return d2d_device_; }
  public: IDXGIDevice3* dxgi_device() const { return dxgi_device_; }
  public: IDXGIFactory2* dxgi_factory() const { return dxgi_factory_; }

  DISALLOW_COPY_AND_ASSIGN(DxDevice);
};

DxDevice::DxDevice() {
  // Create Direct 3D device.
  D3D_FEATURE_LEVEL feature_levels[] = {
      D3D_FEATURE_LEVEL_11_1,
      D3D_FEATURE_LEVEL_11_0,
  };

  auto const d3d11_flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT |
                           D3D11_CREATE_DEVICE_SINGLETHREADED |
                           D3D11_CREATE_DEVICE_DEBUG;

  common::ComPtr<ID3D11Device> d3d_device;
  COM_VERIFY(::D3D11CreateDevice(
      nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
      d3d11_flags, nullptr, 0, D3D11_SDK_VERSION,
      &d3d_device, feature_levels, nullptr));
  COM_VERIFY(dxgi_device_.QueryFrom(d3d_device));

  common::ComPtr<IDXGIAdapter> dxgi_adapter;
  dxgi_device_->GetAdapter(&dxgi_adapter);
  dxgi_adapter->GetParent(IID_PPV_ARGS(&dxgi_factory_));

// Create d2d device context
  COM_VERIFY(Factory::instance()->d2d_factory()->CreateDevice(dxgi_device_,
                                                              &d2d_device_));
}

DxDevice::~DxDevice(){
  {
    auto const event = ::CreateEvent(nullptr, false, false, nullptr);
    COM_VERIFY(dxgi_device_->EnqueueSetEvent(event));
    ::WaitForSingleObject(event, INFINITE);
    ::CloseHandle(event);
    dxgi_device_->Trim();
  }
  dxgi_device_.reset();
}

//////////////////////////////////////////////////////////////////////
//
// SwapChain
//
class SwapChain {
  private: common::ComPtr<ID2D1DeviceContext> d2d_device_context_;
  private: bool is_ready_;
  private: common::ComPtr<IDXGISwapChain2> swap_chain_;
  private: HANDLE swap_chain_waitable_;

  public: SwapChain(DxDevice* dx_device, const D2D1_SIZE_U& size);
  public: ~SwapChain();

  public: ID2D1DeviceContext* d2d_device_context() const {
    return d2d_device_context_;
  }
  public: IDXGISwapChain2* swap_chain() const { return swap_chain_; }

  public: void DidChangeBounds(const D2D1_SIZE_U& size);
  public: bool IsReady();
  public: void Present();
  private: void UpdateDeviceContext();

  DISALLOW_COPY_AND_ASSIGN(SwapChain);
};

SwapChain::SwapChain(DxDevice* dx_device, const D2D1_SIZE_U& size)
    : is_ready_(false), swap_chain_waitable_(nullptr) {
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

  common::ComPtr<IDXGISwapChain1> swap_chain1;
  COM_VERIFY(dx_device->dxgi_factory()->CreateSwapChainForComposition(
      dx_device->dxgi_device(), &swap_chain_desc, nullptr,
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

  COM_VERIFY(dx_device->d2d_device()->CreateDeviceContext(
      D2D1_DEVICE_CONTEXT_OPTIONS_NONE, &d2d_device_context_));

  UpdateDeviceContext();
}

SwapChain::~SwapChain() {
  d2d_device_context_->SetTarget(nullptr);
  d2d_device_context_.MustBeNoOtherUse();
  d2d_device_context_.reset();
  swap_chain_.MustBeNoOtherUse();
}

void SwapChain::DidChangeBounds(const D2D1_SIZE_U& size) {
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
    common::ComPtr<IDXGISurface> dxgi_back_buffer;
    swap_chain_->GetBuffer(0, IID_PPV_ARGS(&dxgi_back_buffer));

    float dpi_x, dpi_y;
    gfx::Factory::instance()->d2d_factory()->GetDesktopDpi(&dpi_x, &dpi_y);
    auto const bitmap_properties = D2D1::BitmapProperties1(
        D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW,
        D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM,
                          D2D1_ALPHA_MODE_PREMULTIPLIED),
        dpi_x, dpi_y);

    common::ComPtr<ID2D1Bitmap1> d2d_back_buffer;
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
  private: common::ComPtr<ID2D1Bitmap1> bitmap_;

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
  private: common::ComPtr<ID2D1SolidColorBrush> brush_;

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

#endif //!defined(INCLUDE_gfx_gfx_h)
